import {
  Braces,
  File as FileIconBase,
  FileCode2,
  FileCog,
  FileJson,
  FileText,
  FileImage,
  FileType2,
  Folder,
  FolderOpen,
  Images,
  Package,
  Settings2,
  Terminal,
  TestTube2,
} from "lucide-react";
import { extOf } from "@/lib/github";
import { languageColor } from "@/lib/analysis";
import { cn } from "@/utils/cn";

const MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ts: FileCode2,
  tsx: FileCode2,
  mts: FileCode2,
  js: FileCode2,
  jsx: FileCode2,
  mjs: FileCode2,
  cjs: FileCode2,
  json: FileJson,
  jsonc: FileJson,
  md: FileText,
  mdx: FileText,
  txt: FileText,
  css: FileType2,
  scss: FileType2,
  sass: FileType2,
  html: FileType2,
  vue: FileCode2,
  svelte: FileCode2,
  svg: FileImage,
  png: Images,
  jpg: Images,
  jpeg: Images,
  gif: Images,
  webp: Images,
  ico: Images,
  yml: FileCog,
  yaml: FileCog,
  toml: FileCog,
  env: FileCog,
  lock: FileCog,
  sh: Terminal,
  bash: Terminal,
  zsh: Terminal,
  py: FileCode2,
  go: FileCode2,
  rs: FileCode2,
  java: FileCode2,
  rb: FileCode2,
  c: FileCode2,
  h: FileCode2,
  cpp: FileCode2,
  cs: FileCode2,
  sql: Braces,
  graphql: Braces,
  prisma: Braces,
};

export function FileGlyph({
  path,
  isFolder,
  open,
  className,
}: {
  path: string;
  isFolder?: boolean;
  open?: boolean;
  className?: string;
}) {
  if (isFolder) {
    const FolderIcon = open ? FolderOpen : Folder;
    return <FolderIcon className={cn("h-4 w-4 shrink-0", className)} />;
  }
  const ext = extOf(path);
  const Icon = MAP[ext] ?? FileIconBase;
  return (
    <Icon
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden="true"
    />
  );
}

/** Tinted icon so file types read instantly in the explorer. */
export function FileTypeIcon({
  path,
  isFolder,
  open,
  className,
}: {
  path: string;
  isFolder?: boolean;
  open?: boolean;
  className?: string;
}) {
  const ext = extOf(path);
  if (isFolder) {
    return (
      <FileGlyph
        path={path}
        isFolder
        open={open}
        className={cn("text-accent/80", className)}
      />
    );
  }
  if (ext === "test" || ext === "spec") {
    return <TestTube2 className={cn("h-4 w-4 shrink-0 text-ok", className)} />;
  }
  if (/^(lock|sum)$/.test(ext)) {
    return <Package className={cn("h-4 w-4 shrink-0 text-faint", className)} />;
  }
  if (/^(yml|yaml|toml|ini|conf|cfg)$/.test(ext)) {
    return <Settings2 className={cn("h-4 w-4 shrink-0 text-info", className)} />;
  }
  const lang = ext ? languageColor(ext) : "";
  return (
    <span className="inline-flex shrink-0" style={{ color: lang || undefined }}>
      <FileGlyph path={path} className={className} />
    </span>
  );
}
