"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import type { ConceptNode } from "@/data/types";

export function ConceptFlow({ title, caption, nodes }: { title: string; caption: string; nodes: ConceptNode[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setActive((a) => (a + 1) % nodes.length), 2800);
    return () => clearInterval(id);
  }, [playing, nodes.length]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink bg-sun-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-ink-3 uppercase">Peta konsep</p>
          <h3 className="mt-0.5 text-lg font-extrabold">{title}</h3>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="chip !px-3 !py-1.5 hover:bg-sun-200"
          aria-label={playing ? "Jeda animasi" : "Putar animasi"}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? "Jeda" : "Putar"}
        </button>
      </div>

      <div className="bg-grid-ink px-5 pt-8 pb-6 sm:px-8">
        {/* Jalur node */}
        <div className="relative">
          <div className="absolute top-7 right-[10%] left-[10%] hidden h-1 rounded-full bg-ink/15 md:block" />
          <motion.div
            className="absolute top-7 left-[10%] hidden h-1 rounded-full bg-ink md:block"
            animate={{ width: `${(active / (nodes.length - 1)) * 80}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
          <ol className="relative grid gap-3 md:grid-cols-5 md:gap-2">
            {nodes.map((n, i) => {
              const done = i <= active;
              return (
                <li key={n.label} className="flex md:flex-col md:items-center">
                  <button
                    onClick={() => { setActive(i); setPlaying(false); }}
                    className="group flex w-full items-center gap-3 text-left md:flex-col md:text-center"
                    aria-current={i === active}
                  >
                    <motion.span
                      animate={{ scale: i === active ? 1.12 : 1, rotate: i === active ? -4 : 0 }}
                      className={`relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink font-mono text-lg font-bold transition-colors ${
                        i === active ? "bg-sun-400 shadow-hard" : done ? "bg-sun-200" : "bg-paper"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </motion.span>
                    <span className={`text-sm font-bold transition-colors ${i === active ? "text-ink" : "text-muted group-hover:text-ink"}`}>{n.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative mt-6 min-h-[92px] rounded-xl border-2 border-ink bg-paper p-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <p className="font-mono text-xs font-bold text-ink-3">LANGKAH {active + 1} / {nodes.length}</p>
              <p className="mt-1 text-base font-bold">{nodes[active].label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{nodes[active].detail}</p>
            </motion.div>
          </AnimatePresence>
          {playing && (
            <motion.div key={`bar-${active}`} className="absolute bottom-0 left-0 h-1 rounded-b-xl bg-sun-400" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.8, ease: "linear" }} />
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">{caption}</p>
      </div>
    </div>
  );
}
