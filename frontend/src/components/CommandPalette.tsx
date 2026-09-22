import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileText, LayoutDashboard, Search, Settings, Users } from "lucide-react";

const items = [
  { icon: LayoutDashboard, label: "Go to Dashboard", hint: "G D" },
  { icon: Users, label: "Search customers…", hint: "G C" },
  { icon: FileText, label: "View invoices", hint: "G I" },
  { icon: Settings, label: "Open settings", hint: "G S" },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm p-4 flex justify-center pt-[14vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl h-fit"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input autoFocus placeholder="Type a command or search…" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">ESC</kbd>
            </div>
            <div className="p-2">
              {items.map((i) => (
                <button key={i.label} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted text-left">
                  <i.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{i.label}</span>
                  <span className="text-[11px] text-muted-foreground">{i.hint}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
            <div className="border-t border-border bg-muted/50 px-4 py-2.5 text-[11px] text-muted-foreground">
              Tip — press <kbd className="rounded border border-border px-1">⌘K</kbd> anywhere to open search
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
