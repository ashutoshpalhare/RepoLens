import type { ImportRef, ParsedFile, SymbolDef, SymbolKind } from "@/types/repo";

/**
 * Extremely lightweight source parsing for TypeScript/JavaScript-family files.
 * Regex based on purpose: it must never throw, never block the UI, and degrade
 * gracefully on syntax it does not understand. This is not a compiler.
 */

const SPEC_RE =
  /(?:\bfrom\s*|\bimport\s+|\brequire\s*\(\s*|\bimport\s*\(\s*)["']([^"'\n]+)["']/g;

const DECL_RE =
  /^[ \t]*(export\s+)?(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(function\*?|class|const|let|var|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm;

const NAMED_EXPORT_RE = /export\s*\{([^}]*)\}/g;

const RESOLVE_EXT = ["ts", "tsx", "js", "jsx", "mjs", "cjs", "vue", "svelte"];

/** Strip line/block comments so commented-out imports do not pollute the graph. */
function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

function classify(spec: string): ImportRef["kind"] {
  if (spec.startsWith(".")) return "relative";
  if (spec.startsWith("@/") || spec.startsWith("~/") || spec.startsWith("#")) return "alias";
  return "package";
}

/** Package name for a bare specifier ("react-dom/client" -> "react-dom"). */
export function packageName(spec: string) {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? spec);
}

function candidatesFor(target: string) {
  return [
    target,
    ...RESOLVE_EXT.flatMap((e) => [`${target}.${e}`, `${target}/index.${e}`]),
  ];
}

/** Resolve a relative specifier against the importing file. */
export function resolveRelative(fromPath: string, spec: string, fileSet: Set<string>) {
  const base = fromPath.split("/").slice(0, -1);
  for (const part of spec.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") base.pop();
    else base.push(part);
  }
  return candidatesFor(base.join("/")).find((c) => fileSet.has(c)) ?? null;
}

/**
 * Resolve an alias specifier (`@/x`, `~/x`) by probing the common source roots
 * present in the repository. No tsconfig parsing — just plausible prefixes.
 */
export function resolveAlias(spec: string, fileSet: Set<string>, roots: string[]) {
  const rest = spec.replace(/^[@~#]\/?/, "").replace(/^\/+/, "");
  if (!rest) return null;
  for (const root of roots) {
    const target = root ? `${root}/${rest}` : rest;
    const hit = candidatesFor(target).find((c) => fileSet.has(c));
    if (hit) return hit;
  }
  return null;
}

const COMPONENT_RE = /^[A-Z]/;

export function parseSource(path: string, source: string, fileSet: Set<string>, roots: string[]): ParsedFile {
  const code = stripComments(source);
  const imports: ImportRef[] = [];
  const seenSpec = new Set<string>();

  SPEC_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPEC_RE.exec(code))) {
    const spec = m[1]!;
    if (seenSpec.has(spec)) continue;
    seenSpec.add(spec);
    const kind = classify(spec);
    const resolved =
      kind === "relative"
        ? resolveRelative(path, spec, fileSet)
        : kind === "alias"
          ? resolveAlias(spec, fileSet, roots)
          : null;
    imports.push({ spec, resolved, kind });
  }

  const symbols: SymbolDef[] = [];
  const exports = new Set<string>();
  const lineStarts: number[] = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === "\n") lineStarts.push(i + 1);
  const lineOf = (index: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid]! <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(code))) {
    const exported = !!m[1];
    const raw = m[2]!;
    const name = m[3]!;
    let kind: SymbolKind =
      raw.startsWith("function")
        ? "function"
        : raw === "class"
          ? "class"
          : raw === "type"
            ? "type"
            : raw === "interface"
              ? "interface"
              : raw === "enum"
                ? "enum"
                : "const";
    if ((kind === "const" || kind === "function") && COMPONENT_RE.test(name)) kind = "component";
    symbols.push({ name, kind, path, line: lineOf(m.index), exported });
    if (exported) exports.add(name);
  }

  NAMED_EXPORT_RE.lastIndex = 0;
  while ((m = NAMED_EXPORT_RE.exec(code))) {
    for (const piece of m[1]!.split(",")) {
      const name = piece.split(/\s+as\s+/).pop()?.trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) exports.add(name);
    }
  }
  if (/export\s+default\b/.test(code)) exports.add("default");

  return {
    path,
    loc: source.split("\n").length,
    imports,
    exports: [...exports],
    symbols,
  };
}
