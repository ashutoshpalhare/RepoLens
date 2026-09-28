import {
  Braces,
  FileCode2,
  FileImage,
  FileJson,
  FileLock2,
  FileText,
  FileType2,
  Hash,
  Palette,
  Settings2,
  Terminal,
} from "lucide-react";
import { extOf } from "@/lib/github";
import { cn } from "@/lib/utils";

const MAP: Record<string, { icon: typeof FileCode2; tone: string }> = {
  ts: { icon: FileCode2, tone: "text-syntax-fn" },
  tsx: { icon: FileCode2, tone: "text-syntax-fn" },
  js: { icon: Braces, tone: "text-syntax-key" },
  jsx: { icon: Braces, tone: "text-syntax-key" },
  mjs: { icon: Braces, tone: "text-syntax-key" },
  cjs: { icon: Braces, tone: "text-syntax-key" },
  json: { icon: FileJson, tone: "text-syntax-num" },
  md: { icon: FileText, tone: "text-muted-foreground" },
  mdx: { icon: FileText, tone: "text-muted-foreground" },
  css: { icon: Palette, tone: "text-syntax-str" },
  scss: { icon: Palette, tone: "text-syntax-str" },
  html: { icon: FileType2, tone: "text-syntax-num" },
  sh: { icon: Terminal, tone: "text-syntax-str" },
  yml: { icon: Settings2, tone: "text-muted-foreground" },
  yaml: { icon: Settings2, tone: "text-muted-foreground" },
  toml: { icon: Settings2, tone: "text-muted-foreground" },
  lock: { icon: FileLock2, tone: "text-muted-foreground" },
  png: { icon: FileImage, tone: "text-syntax-fn" },
  jpg: { icon: FileImage, tone: "text-syntax-fn" },
  jpeg: { icon: FileImage, tone: "text-syntax-fn" },
  svg: { icon: FileImage, tone: "text-syntax-fn" },
  gif: { icon: FileImage, tone: "text-syntax-fn" },
  py: { icon: Hash, tone: "text-syntax-str" },
  rs: { icon: FileCode2, tone: "text-syntax-num" },
  go: { icon: FileCode2, tone: "text-syntax-fn" },
};

export function FileTypeIcon({ path, className }: { path: string; className?: string }) {
  const entry = MAP[extOf(path)] ?? { icon: FileText, tone: "text-muted-foreground" };
  const Icon = entry.icon;
  return <Icon aria-hidden className={cn("size-4 shrink-0", entry.tone, className)} />;
}
