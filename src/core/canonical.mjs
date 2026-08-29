function normalize(value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON does not support non-finite numbers");
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (typeof value !== "object") {
    throw new TypeError(`Canonical JSON does not support ${typeof value}`);
  }

  if (seen.has(value)) {
    throw new TypeError("Canonical JSON does not support cyclic values");
  }
  seen.add(value);

  let result;
  if (Array.isArray(value)) {
    result = value.map((entry) => normalize(entry, seen));
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Canonical JSON supports only plain objects and arrays");
    }
    result = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) {
        throw new TypeError(`Canonical JSON does not support undefined at ${key}`);
      }
      result[key] = normalize(value[key], seen);
    }
  }

  seen.delete(value);
  return result;
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value, new Set()));
}
