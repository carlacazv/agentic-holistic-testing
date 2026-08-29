function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function redactText(input, { secrets = [] } = {}) {
  if (typeof input !== "string") throw new TypeError("Redaction input must be text");
  if (!Array.isArray(secrets) || secrets.some((secret) => typeof secret !== "string")) {
    throw new TypeError("Configured secrets must be strings");
  }

  let text = input;
  let replacements = 0;
  const types = new Set();
  const apply = (pattern, replacement, type) => {
    text = text.replace(pattern, (...args) => {
      replacements += 1;
      types.add(type);
      return typeof replacement === "function" ? replacement(...args) : replacement;
    });
  };

  for (const secret of [...new Set(secrets)].sort((a, b) => b.length - a.length)) {
    if (secret.length === 0) continue;
    apply(new RegExp(escapeRegExp(secret), "g"), "[REDACTED:configured-secret]", "configured-secret");
  }

  apply(
    /-----BEGIN ([A-Z0-9 ]*PRIVATE KEY)-----[\s\S]*?-----END \1-----/g,
    (_match, label) => `-----BEGIN ${label}-----\n[REDACTED:private-key]\n-----END ${label}-----`,
    "private-key",
  );
  apply(
    /^(\s*authorization\s*:\s*)(?:bearer|basic)\s+[^\r\n]+/gim,
    "$1[REDACTED:authorization]",
    "authorization",
  );
  apply(/^(\s*(?:set-)?cookie\s*:\s*)[^\r\n]+/gim, "$1[REDACTED:cookie]", "cookie");
  apply(
    /([?&](?:access_token|api_key|apikey|token|secret|password)=)[^&#\s]+/gi,
    "$1[REDACTED:url-credential]",
    "url-credential",
  );
  apply(
    /("(?:access[_-]?token|api[_-]?key|secret|password|client[_-]?secret)"\s*:\s*")[^"]*(")/gi,
    "$1[REDACTED:json-credential]$2",
    "json-credential",
  );

  return { text, replacements, types: [...types].sort() };
}
