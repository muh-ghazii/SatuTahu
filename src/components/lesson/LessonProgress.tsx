"use client";

import Link from "next/link";
import { Check, CheckCheck } from "lucide-react";
import { motion } from "motion/react";
import type { Track } from "@/data/types";
import { topicId } from "@/lib/progress";
import { useTrackProgress } from "../TrackProgress";

/** Checklist topik di akhir modul: menandai pemahaman per sub-bab */
export function LessonChecklist({ track, stageId }: { track: Track; stageId: string }) {
  const p = useTrackProgress(track);
  const stage = track.stages.find((s) => s.id === stageId)!;
  const ids = stage.topics.map((_, i) => topicId(stage.id, i));
  const all = ids.every((id) => p.done.has(id));
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-sun-100 px-5 py-3">
        <p className="font-extrabold">Sudah paham? Centang topiknya</p>
        <button onClick={() => p.setMany(ids, !all)} className={`btn !px-3 !py-1.5 !text-xs ${all ? "btn-dark" : "btn-primary"}`}>
          <CheckCheck className="size-4" /> {all ? "Modul selesai ✓" : "Tandai modul selesai"}
        </button>
      </div>
      <ul className="grid gap-2 p-4 sm:grid-cols-2">
        {stage.topics.map((t, i) => {
          const checked = p.done.has(ids[i]);
          return (
            <li key={t}>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 text-sm ${checked ? "border-ink bg-sun-100" : "border-line hover:border-ink/50"}`}>
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => p.toggle(ids[i])} />
                <span className={`grid size-5 shrink-0 place-items-center rounded-md border-2 border-ink ${checked ? "bg-ink" : "bg-paper"}`}>
                  {checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="size-3.5 text-sun-300" strokeWidth={3.5} /></motion.span>}
                </span>
                {t}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Daftar modul di sidebar dengan status progres */
export function ModuleNav({ track, current, label = "Modul dalam jalur" }: { track: Track; current: string; label?: string }) {
  const p = useTrackProgress(track);
  return (
    <nav aria-label={label}>
      <Link href={`/jalur/${track.slug}`} className="text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase hover:text-ink">{track.short}</Link>
      <ol className="mt-2 space-y-1">
        {track.stages.map((s, i) => {
          const d = s.topics.filter((_, k) => p.done.has(topicId(s.id, k))).length;
          const full = d === s.topics.length;
          const cur = s.id === current;
          return (
            <li key={s.id}>
              <Link href={`/belajar/${track.slug}/${s.id}`} className={`flex items-start gap-2.5 rounded-xl px-2 py-2 text-[13px] leading-snug transition-colors ${cur ? "bg-sun-300 font-bold" : "hover:bg-sun-100"}`}>
                <span className={`mt-px grid size-6 shrink-0 place-items-center rounded-md border-2 border-ink text-[11px] font-extrabold ${full ? "bg-ink text-sun-300" : cur ? "bg-paper" : d > 0 ? "bg-sun-200" : "bg-paper"}`}>{full ? <Check className="size-3" strokeWidth={3.5} /> : i + 1}</span>
                <span>{s.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
