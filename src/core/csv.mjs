function encodeField(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function assertColumns(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new TypeError("CSV columns must be a non-empty array");
  }
  if (columns.some((column) => typeof column !== "string" || column.length === 0)) {
    throw new TypeError("CSV column names must be non-empty strings");
  }
  if (new Set(columns).size !== columns.length) {
    throw new TypeError("CSV columns must be unique");
  }
}

export function serializeCsv(columns, records) {
  assertColumns(columns);
  if (!Array.isArray(records)) {
    throw new TypeError("CSV records must be an array");
  }
  const lines = [columns.map(encodeField).join(",")];
  for (const [index, record] of records.entries()) {
    if (record === null || typeof record !== "object" || Array.isArray(record)) {
      throw new TypeError(`CSV record ${index + 1} must be an object`);
    }
    const undeclared = Object.keys(record).filter((key) => !columns.includes(key));
    if (undeclared.length > 0) {
      throw new TypeError(`CSV record ${index + 1} has undeclared columns: ${undeclared.join(", ")}`);
    }
    lines.push(columns.map((column) => encodeField(record[column])).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

function parseRows(text) {
  if (typeof text !== "string") {
    throw new TypeError("CSV input must be a string");
  }
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;

  const finishField = () => {
    row.push(field);
    field = "";
    afterQuote = false;
  };
  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (afterQuote && character !== "," && character !== "\r" && character !== "\n") {
      throw new TypeError(`Unexpected character after closing quote at offset ${index}`);
    }
    if (character === '"') {
      if (field.length > 0) {
        throw new TypeError(`Unexpected quote at offset ${index}`);
      }
      quoted = true;
    } else if (character === ",") {
      finishField();
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      finishRow();
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new TypeError("CSV input has an unterminated quoted field");
  }
  if (field.length > 0 || row.length > 0) {
    finishRow();
  }
  return rows;
}

export function parseCsv(text, { columns, strict = true } = {}) {
  const rows = parseRows(text);
  if (rows.length === 0) {
    throw new TypeError("CSV input must include a header row");
  }
  const header = rows[0];
  assertColumns(header);

  if (columns !== undefined) {
    assertColumns(columns);
    const undeclared = header.filter((column) => !columns.includes(column));
    const missing = columns.filter((column) => !header.includes(column));
    if (strict && (undeclared.length > 0 || missing.length > 0)) {
      throw new TypeError(
        `CSV header mismatch; undeclared: ${undeclared.join(", ") || "none"}; missing: ${missing.join(", ") || "none"}`,
      );
    }
  }

  return rows.slice(1).map((values, index) => {
    if (values.length !== header.length) {
      throw new TypeError(
        `CSV row ${index + 2} has ${values.length} fields; expected ${header.length}`,
      );
    }
    return Object.fromEntries(header.map((column, columnIndex) => [column, values[columnIndex]]));
  });
}
