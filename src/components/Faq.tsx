"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q} className={`rounded-2xl border-2 border-ink bg-paper transition-shadow ${isOpen ? "shadow-hard" : ""}`}>
            <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold" aria-expanded={isOpen}>
              {it.q}
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className={`grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink ${isOpen ? "bg-sun-400" : "bg-cream"}`}>
                <Plus className="size-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
