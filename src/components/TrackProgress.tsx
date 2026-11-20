"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import type { Track } from "@/data/types";
import { topicId, useProgress } from "@/lib/progress";

export function useTrackProgress(track: Track) {
  const { state, toggle, setMany, reset } = useProgress();
  const done = new Set(state[track.slug] ?? []);
  const all = track.stages.flatMap((s) => s.topics.map((_, i) => topicId(s.id, i)));
  const count = all.filter((id) => done.has(id)).length;
  return { done, count, total: all.length, pct: all.length ? count / all.length : 0, toggle: (id: string) => toggle(track.slug, id), setMany: (ids: string[], v: boolean) => setMany(track.slug, ids, v), reset: () => reset(track.slug) };
}

export function ProgressRing({ pct, size = 96, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-cream)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink)" strokeWidth={stroke + 3} strokeOpacity={0.08} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sun-400)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ type: "spring", stiffness: 80, damping: 18 }} />
    </svg>
  );
}

export function TrackProgressCard({ track }: { track: Track }) {
  const p = useTrackProgress(track);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const next = track.stages.find((s) => s.topics.some((_, i) => !p.done.has(topicId(s.id, i))));
  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <ProgressRing pct={mounted ? p.pct : 0} />
        <span className="absolute inset-0 grid place-items-center text-xl font-extrabold">{mounted ? Math.round(p.pct * 100) : 0}%</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{mounted ? p.count : 0} dari {p.total} topik dikuasai</p>
        {mounted && p.count > 0 && next && <p className="mt-1 truncate text-xs text-muted">Lanjut: {next.title}</p>}
        {mounted && p.pct === 1 && <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#1f8a4c]"><Check className="size-3.5" /> Jalur selesai. Keren!</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`#${next?.id ?? track.stages[0].id}`} className="btn btn-primary !px-3 !py-1.5 !text-xs">{mounted && p.count > 0 ? "Lanjutkan" : "Mulai tahap 1"}</a>
          {mounted && p.count > 0 && (
            <button onClick={() => confirm("Reset progres jalur ini?") && p.reset()} className="chip !px-3 hover:bg-cream">
              <RotateCcw className="size-3" /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
