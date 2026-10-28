/**
 * Shiki-based syntax highlighting (https://shiki.style).
 *
 * - Runs fully in the browser: `shiki/core` + the JavaScript RegExp engine (no WASM, no Node APIs).
 * - Lazy: Shiki itself, both themes and each grammar are dynamically imported on first use,
 *   so the code viewer can paint plain text immediately and swap in tokens afterwards.
 * - Safe: we only use `codeToTokens` and return plain token data. Rendering stays in React
 *   (text nodes + inline CSS variables) — no HTML strings, no innerHTML.
 */
import type { HighlighterCore } from "shiki/core";

/** Inline style for one token: Shiki dual-theme CSS variables (--shiki-dark, --shiki-light, …). */
export type HighlightToken = { content: string; style?: Record<string, string> };
export type HighlightLine = HighlightToken[];

/**
 * Only the grammars listed here are bundled; everything else renders as plain text.
 * The GitHub Pages build is a single inlined HTML file (vite-plugin-singlefile), so every grammar
 * here ships in that file even though it is only parsed on demand. Grammars that drag in many
 * embedded languages (ruby, php, cpp, graphql) or are very large (csharp, swift, kotlin) are left out on purpose.
 */
const LANG_LOADERS = {
  typescript: () => import("@shikijs/langs/typescript"),
  tsx: () => import("@shikijs/langs/tsx"),
  javascript: () => import("@shikijs/langs/javascript"),
  json: () => import("@shikijs/langs/json"),
  jsonc: () => import("@shikijs/langs/jsonc"),
  markdown: () => import("@shikijs/langs/markdown"),
  css: () => import("@shikijs/langs/css"),
  scss: () => import("@shikijs/langs/scss"),
  html: () => import("@shikijs/langs/html"),
  xml: () => import("@shikijs/langs/xml"),
  yaml: () => import("@shikijs/langs/yaml"),
  toml: () => import("@shikijs/langs/toml"),
  python: () => import("@shikijs/langs/python"),
  go: () => import("@shikijs/langs/go"),
  rust: () => import("@shikijs/langs/rust"),
  java: () => import("@shikijs/langs/java"),
  c: () => import("@shikijs/langs/c"),
  shellscript: () => import("@shikijs/langs/shellscript"),
  sql: () => import("@shikijs/langs/sql"),
  dockerfile: () => import("@shikijs/langs/dockerfile"),
  makefile: () => import("@shikijs/langs/makefile"),
  diff: () => import("@shikijs/langs/diff"),
  ini: () => import("@shikijs/langs/ini"),
};

export type HighlightLanguage = keyof typeof LANG_LOADERS | "text";

const EXT_TO_LANG: Record<string, HighlightLanguage> = {
  ts: "typescript", mts: "typescript", cts: "typescript",
  tsx: "tsx",
  js: "javascript", mjs: "javascript", cjs: "javascript",
  // The TSX grammar handles JSX correctly; reusing it avoids bundling a near-identical grammar.
  jsx: "tsx",
  json: "json", jsonc: "jsonc",
  md: "markdown", mdx: "markdown", markdown: "markdown",
  css: "css", less: "css", scss: "scss",
  html: "html", htm: "html", vue: "html", svelte: "html",
  xml: "xml", svg: "xml", plist: "xml",
  yml: "yaml", yaml: "yaml",
  toml: "toml",
  py: "python", pyi: "python",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c", h: "c",
  sh: "shellscript", bash: "shellscript", zsh: "shellscript",
  sql: "sql",
  diff: "diff", patch: "diff",
  ini: "ini", cfg: "ini",
};

const FILENAME_TO_LANG: Record<string, HighlightLanguage> = {
  dockerfile: "dockerfile",
  containerfile: "dockerfile",
  makefile: "makefile",
  gnumakefile: "makefile",
  "tsconfig.json": "jsonc",
  "jsconfig.json": "jsonc",
  ".eslintrc": "jsonc",
  ".babelrc": "jsonc",
  ".bashrc": "shellscript",
  ".zshrc": "shellscript",
  ".profile": "shellscript",
  ".env": "ini",
  ".editorconfig": "ini",
};

/** Map a file path to a Shiki language id; unknown files are plain text. */
export function languageFromPath(path: string): HighlightLanguage {
  const base = (path.split("/").pop() ?? "").toLowerCase();
  const byName = FILENAME_TO_LANG[base];
  if (byName) return byName;
  if (base.startsWith("dockerfile.")) return "dockerfile";
  if (base.startsWith(".env.")) return "ini";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "text";
  return EXT_TO_LANG[base.slice(dot + 1)] ?? "text";
}

const THEMES = { dark: "github-dark-default", light: "github-light-default" } as const;

/** Swap GitHub's keyword red for the RepoLens amber accent so code matches the UI. */
const COLOR_REPLACEMENTS: Record<string, Record<string, string>> = {
  "github-dark-default": { "#ff7b72": "#f59e0b" },
  "github-light-default": { "#cf222e": "#b45309" },
};

/** Tokenizing is synchronous; past these limits the remainder stays plain text (still readable). */
export const HIGHLIGHT_MAX_LINES = 5_000;
export const HIGHLIGHT_MAX_CHARS = 250_000;

let highlighterPromise: Promise<HighlighterCore> | null = null;
const languagePromises = new Map<keyof typeof LANG_LOADERS, Promise<void>>();

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
        import("shiki/core"),
        import("shiki/engine/javascript"),
      ]);
      return createHighlighterCore({
        themes: [import("@shikijs/themes/github-dark-default"), import("@shikijs/themes/github-light-default")],
        langs: [],
        // `forgiving` degrades gracefully instead of throwing on an untranslatable pattern.
        engine: createJavaScriptRegexEngine({ forgiving: true }),
      });
    })();
    // Allow a later retry if the lazy chunk failed (e.g. flaky network in dev).
    highlighterPromise.catch(() => {
      highlighterPromise = null;
    });
  }
  return highlighterPromise;
}

function ensureLanguage(highlighter: HighlighterCore, lang: keyof typeof LANG_LOADERS): Promise<void> {
  let pending = languagePromises.get(lang);
  if (!pending) {
    pending = highlighter.loadLanguage(LANG_LOADERS[lang]);
    pending.catch(() => languagePromises.delete(lang));
    languagePromises.set(lang, pending);
  }
  return pending;
}

/** Normalize line endings so plain and highlighted lines always align. */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/**
 * Highlight the start of `code` (up to the limits above).
 * Resolves to `null` for plain-text files or if Shiki fails — callers keep the plain rendering.
 */
export async function highlightLines(code: string, path: string): Promise<HighlightLine[] | null> {
  const lang = languageFromPath(path);
  if (lang === "text") return null;

  try {
    const highlighter = await getHighlighter();
    await ensureLanguage(highlighter, lang);

    // Let the plain-text render paint before the synchronous tokenize pass.
    await new Promise((resolve) => setTimeout(resolve, 0));

    let source = normalizeNewlines(code);
    if (source.length > HIGHLIGHT_MAX_CHARS) source = source.slice(0, source.lastIndexOf("\n", HIGHLIGHT_MAX_CHARS) + 1 || HIGHLIGHT_MAX_CHARS);
    const lines = source.split("\n");
    if (lines.length > HIGHLIGHT_MAX_LINES) source = lines.slice(0, HIGHLIGHT_MAX_LINES).join("\n");

    const { tokens } = highlighter.codeToTokens(source, {
      lang,
      themes: THEMES,
      defaultColor: false,
      colorReplacements: COLOR_REPLACEMENTS,
      // Minified one-liners stay readable but aren't tokenized character by character.
      tokenizeMaxLineLength: 2_000,
    });

    return tokens.map((line) =>
      line.map((token) => ({ content: token.content, style: token.htmlStyle as Record<string, string> | undefined })),
    );
  } catch (error) {
    console.warn("[RepoLens] Syntax highlighting unavailable, showing plain text.", error);
    return null;
  }
}
