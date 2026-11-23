"use client";

import { Modal } from "@/components/ui/Modal";

const groups = [
  {
    title: "General",
    items: [
      { keys: ["Ctrl", "K"], label: "Open the command palette" },
      { keys: ["/"], label: "Focus the search box" },
      { keys: ["?"], label: "Show this list" },
      { keys: ["Esc"], label: "Close a dialog or menu" },
    ],
  },
  {
    title: "Go to (press G, then a key)",
    items: [
      { keys: ["G", "D"], label: "Dashboard" },
      { keys: ["G", "P"], label: "Projects" },
      { keys: ["G", "S"], label: "Space Planner" },
      { keys: ["G", "O"], label: "Optimization" },
      { keys: ["G", "L"], label: "Layouts" },
      { keys: ["G", "A"], label: "Analytics" },
    ],
  },
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" description="Everything in ArchOpt can be reached without a mouse." size="md">
      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{g.title}</h3>
            <dl className="m-0 flex flex-col divide-y divide-line border border-line rounded-sm">
              {g.items.map((i) => (
                <div key={i.label} className="flex items-center justify-between px-3 py-2">
                  <dt className="text-sm text-ink">{i.label}</dt>
                  <dd className="m-0 flex gap-1">
                    {i.keys.map((k) => (
                      <kbd key={k} className="min-w-6 border border-line-strong bg-bg px-1.5 py-0.5 text-center text-xs font-medium text-ink rounded-xs">
                        {k}
                      </kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  );
}
