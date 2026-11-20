"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, Check, Clock, Flag, Target } from "lucide-react";
import type { Stage, Track } from "@/data/types";
import { topicId } from "@/lib/progress";
import { useTrackProgress } from "./TrackProgress";
import { RepoCard } from "./RepoCard";

export function StageNav({ track }: { track: Track }) {
  const p = useTrackProgress(track);
  return (
    <nav aria-label="Daftar tahap" className="card p-3">
      <p className="px-2 pt-1 pb-2 text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">Daftar tahap</p>
      <ol className="space-y-1">
        {track.stages.map((s, i) => {
          const d = s.topics.filter((_, k) => p.done.has(topicId(s.id, k))).length;
          const full = d === s.topics.length;
          return (
            <li key={s.id}>
              <a href={`#${s.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sun-100">
                <span className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 border-ink text-xs font-extrabold ${full ? "bg-ink text-sun-300" : d > 0 ? "bg-sun-300" : "bg-paper"}`}>
                  {full ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{s.title}</span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-cream">
                    <span className="block h-full rounded-full bg-sun-400 transition-all" style={{ width: `${(d / s.topics.length) * 100}%` }} />
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StageSection({ track, stage, index }: { track: Track; stage: Stage; index: number }) {
  const p = useTrackProgress(track);
  const ids = stage.topics.map((_, i) => topicId(stage.id, i));
  const doneCount = ids.filter((id) => p.done.has(id)).length;
  const allDone = doneCount === ids.length;

  return (
    <section id={stage.id} className="scroll-mt-24">
      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-start gap-4 border-b-2 border-ink bg-sun-50 p-5 sm:p-6">
          <span className={`grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink text-2xl font-extrabold shadow-hard-sm ${allDone ? "bg-ink text-sun-300" : "bg-sun-400"}`}>
            {allDone ? <Check className="size-7" strokeWidth={3} /> : index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-bold text-ink-3">TAHAP {index + 1}</p>
            <h3 className="mt-0.5 text-xl leading-snug font-extrabold sm:text-2xl">{stage.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="chip"><Clock className="size-3" /> {stage.duration}</span>
              <span className="chip">{stage.resources.length} repo rujukan</span>
              <span className={`chip ${allDone ? "!bg-ink !text-sun-300" : ""}`}>{doneCount}/{ids.length} topik</span>
            </div>
          </div>
          <Link href={`/belajar/${track.slug}/${stage.id}`} className="btn btn-primary w-full !py-2.5 sm:w-auto">
            <BookOpen className="size-4" /> Pelajari modul <ArrowRight className="size-4" />
          </Link>
        </header>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <div className="flex items-start gap-2.5">
              <Target className="mt-0.5 size-5 shrink-0 text-ink-3" />
              <p className="text-[15px] leading-relaxed"><span className="font-bold">Tujuan: </span>{stage.goal}</p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">Checklist topik</p>
              <button onClick={() => p.setMany(ids, !allDone)} className="text-xs font-bold text-ink-3 underline-offset-2 hover:underline">
                {allDone ? "Batalkan semua" : "Tandai semua"}
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {stage.topics.map((t, i) => {
                const id = ids[i];
                const checked = p.done.has(id);
                return (
                  <li key={id}>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm transition-colors ${checked ? "border-ink bg-sun-100" : "border-line bg-paper hover:border-ink/50"}`}>
                      <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => p.toggle(id)} />
                      <span className={`grid size-5 shrink-0 place-items-center rounded-md border-2 border-ink transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-sun-400 ${checked ? "bg-ink" : "bg-paper"}`}>
                        {checked && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="size-3.5 text-sun-300" strokeWidth={3.5} />
                          </motion.span>
                        )}
                      </span>
                      <span className={checked ? "text-ink-2 line-through decoration-ink/30" : ""}>{t}</span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 rounded-xl border-2 border-ink bg-sun-300 p-4">
              <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] uppercase"><Flag className="size-4" /> Milestone</p>
              <p className="mt-1.5 text-sm leading-relaxed font-medium">{stage.milestone}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">Sumber rujukan di GitHub</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">Materi modul ditulis ulang dari sumber-sumber ini. Kunjungi repo bila ingin mendalami atau melihat kode aslinya.</p>
            <div className="mt-3 grid gap-3">
              {stage.resources.map((r) => (
                <RepoCard key={r.repo} r={r} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
