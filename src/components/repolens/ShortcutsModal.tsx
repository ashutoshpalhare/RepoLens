import { Modal } from "@/components/ui/Modal";
import { Kbd } from "@/components/ui/primitives";

export type Shortcut = { keys: string[]; action: string; note?: string };

export const SHORTCUTS: Shortcut[] = [
  { keys: ["Ctrl/Cmd", "P"], action: "Quick open a file (fuzzy)", note: "Search every path in the repo" },
  { keys: ["Ctrl/Cmd", "Shift", "F"], action: "Focus the explorer filter" },
  { keys: ["Ctrl/Cmd", "B"], action: "Toggle the file explorer" },
  { keys: ["Ctrl/Cmd", "\\"], action: "Toggle the insights panel" },
  { keys: ["."], action: "Open the repo in github.dev" },
  { keys: ["c"], action: "Copy the directory tree" },
  { keys: ["y"], action: "Copy the current file path / permalink" },
  { keys: ["?"], action: "Show this help" },
  { keys: ["Esc"], action: "Close dialogs" },
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyboard shortcuts"
      description="Single-key shortcuts are ignored while you are typing in a field."
      className="max-w-lg"
    >
      <ul className="rl-scroll max-h-[60vh] divide-y divide-line overflow-y-auto">
        {SHORTCUTS.map((shortcut) => (
          <li
            key={shortcut.action}
            className="flex items-center justify-between gap-4 px-4 py-2.5"
          >
            <span className="min-w-0">
              <span className="block text-sm text-ink">{shortcut.action}</span>
              {shortcut.note ? (
                <span className="mt-0.5 block text-[11px] text-faint">{shortcut.note}</span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {shortcut.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
