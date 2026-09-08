import { parse } from "@typescript-eslint/typescript-estree";

const NODE_IGNORED_KEYS = new Set(["comments", "loc", "parent", "range", "tokens"]);

export function parseTypeScript(source, filePath) {
  try {
    return parse(source, {
      comment: false,
      errorOnUnknownASTType: true,
      jsx: true,
      loc: true,
      range: true,
    });
  } catch (error) {
    const location = error?.lineNumber ? `:${error.lineNumber}:${error.column ?? 0}` : "";
    throw new TypeError(`${filePath}${location}: invalid TypeScript: ${error.message}`);
  }
}

export function walkAst(node, visitor, ancestors = []) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visitor(node, ancestors);
  const nextAncestors = typeof node.type === "string" ? [...ancestors, node] : ancestors;
  for (const [key, value] of Object.entries(node)) {
    if (NODE_IGNORED_KEYS.has(key)) continue;
    if (Array.isArray(value)) {
      for (const child of value) walkAst(child, visitor, nextAncestors);
    } else {
      walkAst(value, visitor, nextAncestors);
    }
  }
}

export function callName(callee) {
  if (!callee || typeof callee !== "object") return null;
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "ChainExpression") return callName(callee.expression);
  if (callee.type !== "MemberExpression") return null;
  const object = callName(callee.object);
  const property = callee.computed
    ? staticString(callee.property)
    : callee.property?.type === "Identifier"
      ? callee.property.name
      : null;
  return object && property ? `${object}.${property}` : property;
}

export function propertyName(property) {
  if (!property || property.type !== "Property") return null;
  if (property.computed) return staticString(property.key);
  if (property.key?.type === "Identifier") return property.key.name;
  return staticString(property.key);
}

export function objectProperty(node, name) {
  if (node?.type !== "ObjectExpression") return null;
  return node.properties.find((property) => propertyName(property) === name) ?? null;
}

export function staticString(node) {
  if (node?.type === "Literal" && typeof node.value === "string") return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0]?.value?.cooked ?? node.quasis[0]?.value?.raw ?? "";
  }
  return null;
}

export function textPrefix(node) {
  const complete = staticString(node);
  if (complete !== null) return complete;
  if (node?.type === "TemplateLiteral") {
    return node.quasis[0]?.value?.cooked ?? node.quasis[0]?.value?.raw ?? "";
  }
  return null;
}

export function importedBindings(ast) {
  const bindings = [];
  for (const statement of ast.body ?? []) {
    if (statement.type !== "ImportDeclaration") continue;
    const source = staticString(statement.source);
    for (const specifier of statement.specifiers ?? []) {
      bindings.push({
        imported: specifier.type === "ImportSpecifier"
          ? specifier.imported?.name ?? specifier.imported?.value
          : specifier.type === "ImportDefaultSpecifier"
            ? "default"
            : "*",
        importKind: statement.importKind ?? specifier.importKind ?? "value",
        local: specifier.local?.name,
        source,
      });
    }
  }
  return bindings;
}

export function exportedBindings(ast) {
  const bindings = new Set();
  for (const statement of ast.body ?? []) {
    if (statement.type !== "ExportNamedDeclaration") continue;
    for (const specifier of statement.specifiers ?? []) {
      const name = specifier.exported?.name ?? specifier.exported?.value;
      if (typeof name === "string") bindings.add(name);
    }
    const declaration = statement.declaration;
    if (declaration?.type === "VariableDeclaration") {
      for (const item of declaration.declarations) {
        if (item.id?.type === "Identifier") bindings.add(item.id.name);
      }
    } else if (
      ["ClassDeclaration", "FunctionDeclaration", "TSEnumDeclaration", "TSInterfaceDeclaration", "TSTypeAliasDeclaration"].includes(declaration?.type) &&
      declaration.id?.name
    ) {
      bindings.add(declaration.id.name);
    }
  }
  return bindings;
}

export function declaredClassNames(ast) {
  const names = new Set();
  walkAst(ast, (node) => {
    if (node.type === "ClassDeclaration" && node.id?.name) names.add(node.id.name);
  });
  return names;
}

export function instantiatedClassNames(ast) {
  const names = new Set();
  walkAst(ast, (node) => {
    if (node.type === "NewExpression" && node.callee?.type === "Identifier") {
      names.add(node.callee.name);
    }
  });
  return names;
}
