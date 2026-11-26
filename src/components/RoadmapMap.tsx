"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Flag } from "lucide-react";
import type { Track } from "@/data/types";
import { useProgress, topicId } from "@/lib/progress";

/** Roadmap bergaya ‘peta stasiun’: tiap tahap adalah stasiun yang bisa diklik */
export function RoadmapMap({ track, linkStages = false }: { track: Track; linkStages?: boolean }) {
  const [active, setActive] = useState(0);
  const { state } = useProgress();
  const done = new Set(state[track.slug] ?? []);
  const stagePct = track.stages.map((s) => {
    const total = s.topics.length;
    const d = s.topics.filter((_, i) => done.has(topicId(s.id, i))).length;
    return total ? d / total : 0;
  });
  const s = track.stages[active];
  const n = track.stages.length;

  return (
    <div>
      <div className="no-scrollbar -mx-2 overflow-x-auto px-2 pb-2">
        <div className="relative min-w-[640px] pt-2">
          {/* rel */}
          <div className="absolute top-[32px] h-[6px] rounded-full border-2 border-ink bg-paper" style={{ left: `${50 / n}%`, width: `${100 - 100 / n}%` }} />
          <motion.div
            className="absolute top-[32px] h-[6px] rounded-full border-2 border-ink bg-sun-400"
            style={{ left: `${50 / n}%` }}
            animate={{ width: `${(100 - 100 / n) * (active / Math.max(n - 1, 1))}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
          />
          <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {track.stages.map((st, i) => {
              const isActive = i === active;
              const pct = stagePct[i];
              return (
                <li key={st.id} className="flex flex-col items-center px-1 text-center">
                  <button onClick={() => setActive(i)} className="group flex flex-col items-center" aria-current={isActive}>
                    <span className="relative grid">
                      <motion.span
                        animate={{ y: isActive ? -4 : 0 }}
                        className={`relative z-10 grid size-[54px] place-items-center rounded-full border-2 border-ink text-lg font-extrabold transition-colors ${
                          isActive ? "bg-sun-400 shadow-hard" : pct === 1 ? "bg-ink text-sun-300" : "bg-paper group-hover:bg-sun-100"
                        }`}
                      >
                        {pct === 1 ? "✓" : i + 1}
                      </motion.span>
                      {pct > 0 && pct < 1 && (
                        <svg className="pointer-events-none absolute -top-[5px] -left-[5px] z-20 size-[64px] -rotate-90" viewBox="0 0 64 64" aria-hidden>
                          <circle cx="32" cy="32" r="30" fill="none" stroke="var(--color-sun-500)" strokeWidth="3" strokeDasharray={`${pct * 188.5} 188.5`} strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className={`mt-3 line-clamp-2 max-w-[150px] text-[13px] leading-snug font-bold ${isActive ? "text-ink" : "text-muted group-hover:text-ink"}`}>{st.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-muted"><Clock className="size-3" />{st.duration}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="mt-6 grid gap-5 rounded-2xl border-2 border-ink bg-paper p-5 sm:p-6 md:grid-cols-[1.2fr_1fr]"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs font-bold text-ink-3">TAHAP {active + 1} DARI {n}</p>
              <div className="flex items-center gap-1.5 sm:hidden">
                <button
                  type="button"
                  disabled={active === 0}
                  onClick={() => setActive((a) => Math.max(0, a - 1))}
                  aria-label="Tahap sebelumnya"
                  className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-cream disabled:opacity-35"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={active === n - 1}
                  onClick={() => setActive((a) => Math.min(n - 1, a + 1))}
                  aria-label="Tahap berikutnya"
                  className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sun-300 disabled:opacity-35"
                >
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
            <h3 className="mt-1 text-xl font-extrabold">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.goal}</p>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-sun-100 p-3 text-sm">
              <Flag className="mt-0.5 size-4 shrink-0" />
              <p><span className="font-bold">Milestone: </span>{s.milestone}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">Yang dipelajari</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {s.topics.map((tp) => (
                <li key={tp} className="chip !bg-cream !font-medium">{tp}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">Modul interaktif di SatuTahu · {s.resources.length} repo GitHub sebagai rujukan</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/belajar/${track.slug}/${s.id}`} className="btn btn-primary !py-2"><BookOpen className="size-4" /> Pelajari modul <ArrowRight className="size-4" /></Link>
              {linkStages ? (
                <a href={`#${s.id}`} className="btn btn-ghost !py-2">Checklist & rujukan</a>
              ) : (
                <Link href={`/jalur/${track.slug}#${s.id}`} className="btn btn-ghost !py-2">Lihat jalur {track.short}</Link>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
