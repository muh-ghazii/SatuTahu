"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { tracks } from "@/data";
import { topicId, useProgress } from "@/lib/progress";
import { TrackIcon } from "./icons";
import { ProgressRing } from "./TrackProgress";

export function ProgressDashboard() {
  const { state, reset } = useProgress();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rows = tracks.map((t) => {
    const done = new Set(state[t.slug] ?? []);
    const all = t.stages.flatMap((s) => s.topics.map((_, i) => topicId(s.id, i)));
    const count = all.filter((id) => done.has(id)).length;
    const stagesDone = t.stages.filter((s) => s.topics.every((_, i) => done.has(topicId(s.id, i)))).length;
    const next = t.stages.find((s) => s.topics.some((_, i) => !done.has(topicId(s.id, i))));
    return { t, count, total: all.length, pct: all.length ? count / all.length : 0, stagesDone, next };
  });
  const started = rows.filter((r) => r.count > 0).sort((a, b) => b.pct - a.pct);
  const totalTopics = rows.reduce((a, r) => a + r.count, 0);

  if (!mounted) return <div className="mt-10 h-40 animate-pulse rounded-2xl bg-paper" />;

  if (started.length === 0) {
    return (
      <div className="card mt-10 p-10 text-center">
        <p className="text-5xl">🌱</p>
        <h2 className="mt-4 text-2xl font-extrabold">Belum ada progres</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">Buka salah satu jalur, lalu centang topik yang sudah kamu kuasai. Progresmu akan muncul di sini.</p>
        <Link href="/jalur" className="btn btn-primary mt-6">Pilih jalur <ArrowRight className="size-4" /></Link>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat k={String(started.length)} v="jalur sedang dipelajari" />
        <Stat k={String(totalTopics)} v="topik dikuasai" />
        <Stat k={String(rows.reduce((a, r) => a + r.stagesDone, 0))} v="tahap selesai" />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {started.map(({ t, count, total, pct, next, stagesDone }) => (
          <div key={t.slug} className="card flex items-center gap-5 p-5">
            <div className="relative shrink-0">
              <ProgressRing pct={pct} size={88} stroke={9} />
              <span className="absolute inset-0 grid place-items-center text-lg font-extrabold">{Math.round(pct * 100)}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-extrabold"><TrackIcon name={t.icon} className="size-4" /> {t.name}</p>
              <p className="mt-1 text-sm text-muted">{count}/{total} topik · {stagesDone}/{t.stages.length} tahap</p>
              {next && <p className="mt-1 truncate text-xs text-muted">Berikutnya: {next.title}</p>}
              <div className="mt-3 flex gap-2">
                <Link href={`/jalur/${t.slug}${next ? `#${next.id}` : ""}`} className="btn btn-primary !px-3 !py-1.5 !text-xs">Lanjutkan</Link>
                <button onClick={() => confirm(`Reset progres ${t.short}?`) && reset(t.slug)} className="chip !px-3 hover:bg-cream"><RotateCcw className="size-3" /> Reset</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        Progres tersimpan di browser ini saja.{" "}
        <button onClick={() => confirm("Hapus semua progres?") && reset()} className="font-bold text-ink-3 hover:underline">Hapus semua progres</button>
      </p>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="card p-5">
      <p className="text-4xl font-extrabold">{k}</p>
      <p className="mt-1 text-sm text-muted">{v}</p>
    </div>
  );
}
