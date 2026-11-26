"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Award, Bookmark, Flame, Gamepad2, NotebookPen, RotateCcw, Sparkles, Trash2, Trophy } from "lucide-react";
import { tracks } from "@/data";
import { topicId, useProgress } from "@/lib/progress";
import { useGamification } from "@/lib/gamification";
import { useStudyTools } from "@/lib/study-tools";
import { TrackIcon } from "./icons";
import { ProgressRing } from "./TrackProgress";

function resolveModule(key: string) {
  const [slug, stageId] = key.split("/");
  const t = tracks.find((x) => x.slug === slug);
  const s = t?.stages.find((x) => x.id === stageId);
  return t && s ? { track: t, stage: s } : null;
}

export function ProgressDashboard() {
  const { state, reset } = useProgress();
  const { stats, levelInfo, unlockedBadges, allBadges } = useGamification();
  const { state: tools, toggleBookmark, setNote } = useStudyTools();
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

  const bookmarkItems = tools.bookmarks.map((k) => ({ key: k, info: resolveModule(k) })).filter((x) => x.info !== null);
  const noteEntries = Object.entries(tools.notes)
    .map(([key, text]) => ({ key, text, info: resolveModule(key) }))
    .filter((x) => x.info !== null && x.text.trim().length > 0);

  if (!mounted) return <div className="mt-10 h-40 animate-pulse rounded-2xl bg-paper" />;

  return (
    <div className="mt-8 space-y-10 sm:mt-10">
      {/* Kartu Gamifikasi: Level, XP, Streak */}
      <section aria-label="Level dan streak belajar" className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card bg-sun-300 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="chip !bg-paper font-mono">LEVEL {levelInfo.current.level}</span>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">{levelInfo.current.title}</h2>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-paper px-4 py-2 text-right shadow-hard-sm">
              <p className="text-[11px] font-bold text-muted uppercase">Total XP</p>
              <p className="flex items-center gap-1 font-mono text-2xl font-extrabold">
                <Sparkles className="size-5 text-sun-600" /> {stats.xp}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>{levelInfo.next ? `Menuju Lv.${levelInfo.next.level} ${levelInfo.next.title}` : "Level tertinggi tercapai!"}</span>
              <span>{levelInfo.next ? `${levelInfo.remaining} XP lagi` : "MAX"}</span>
            </div>
            <div className="mt-2 h-3.5 overflow-hidden rounded-full border-2 border-ink bg-paper">
              <div className="h-full bg-ink transition-all duration-500" style={{ width: `${Math.max(4, Math.round(levelInfo.pct * 100))}%` }} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/game" className="btn btn-dark !px-4 !py-2 !text-xs">
              <Gamepad2 className="size-4" /> Tambah XP di Arena Game
            </Link>
            <Link href="/cheatsheet" className="btn btn-ghost !px-4 !py-2 !text-xs">
              Ulas Flashcard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card flex flex-col justify-between bg-paper p-5">
            <Flame className={`size-8 ${stats.streak > 0 ? "text-[#e25822]" : "text-muted"}`} />
            <div className="mt-4">
              <p className="font-mono text-3xl font-extrabold sm:text-4xl">{stats.streak}</p>
              <p className="mt-0.5 text-xs font-semibold text-muted sm:text-sm">Hari streak aktif</p>
              <p className="mt-1 text-[11px] text-muted">Terbaik: {stats.bestStreak} hari</p>
            </div>
          </div>

          <div className="card flex flex-col justify-between bg-paper p-5">
            <Trophy className="size-8 text-sun-600" />
            <div className="mt-4">
              <p className="font-mono text-3xl font-extrabold sm:text-4xl">
                {unlockedBadges.length}/{allBadges.length}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-muted sm:text-sm">Lencana terbuka</p>
              <p className="mt-1 text-[11px] text-muted">Kuis selesai: {stats.quizzesCompleted}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Progres Jalur Belajar */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-extrabold sm:text-2xl">Progres Jalur Belajar</h2>
          {started.length > 0 && (
            <button onClick={() => confirm("Hapus semua progres topik?") && reset()} className="text-xs font-bold text-ink-3 hover:underline">
              Hapus semua progres topik
            </button>
          )}
        </div>

        {started.length === 0 ? (
          <div className="card mt-4 p-8 text-center sm:p-10">
            <p className="text-4xl">🌱</p>
            <h3 className="mt-3 text-xl font-extrabold">Belum ada topik yang dicentang</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">Buka salah satu jalur, baca modulnya, lalu centang topik yang sudah kamu kuasai untuk mendapat +15 XP per topik.</p>
            <Link href="/jalur" className="btn btn-primary mt-5">Pilih jalur <ArrowRight className="size-4" /></Link>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
              <Stat k={String(started.length)} v="jalur aktif" />
              <Stat k={String(totalTopics)} v="topik dikuasai" />
              <Stat k={String(rows.reduce((a, r) => a + r.stagesDone, 0))} v="tahap selesai" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {started.map(({ t, count, total, pct, next, stagesDone }) => (
                <div key={t.slug} className="card flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
                  <div className="relative shrink-0">
                    <ProgressRing pct={pct} size={80} stroke={8} />
                    <span className="absolute inset-0 grid place-items-center text-base font-extrabold">{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-extrabold"><TrackIcon name={t.icon} className="size-4 shrink-0" /> <span className="truncate">{t.name}</span></p>
                    <p className="mt-1 text-xs text-muted sm:text-sm">{count}/{total} topik · {stagesDone}/{t.stages.length} tahap</p>
                    {next && <p className="mt-1 truncate text-xs text-muted">Berikutnya: {next.title}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={next ? `/belajar/${t.slug}/${next.id}` : `/jalur/${t.slug}`} className="btn btn-primary !px-3 !py-1.5 !text-xs">Lanjutkan</Link>
                      <button onClick={() => confirm(`Reset progres ${t.short}?`) && reset(t.slug)} className="chip !px-3 hover:bg-cream"><RotateCcw className="size-3" /> Reset</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Lencana Pencapaian */}
      <section>
        <h2 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">
          <Award className="size-5 text-sun-600" /> Koleksi Lencana
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {allBadges.map((b) => {
            const ok = b.check(stats);
            return (
              <div
                key={b.id}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  ok ? "border-ink bg-sun-100 shadow-hard-sm" : "border-dashed border-ink/30 bg-paper/60 opacity-65"
                }`}
              >
                <span className={`text-2xl ${ok ? "" : "grayscale"}`}>{b.icon}</span>
                <p className="mt-2 text-sm font-extrabold">{b.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bookmark & Catatan Pribadi */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Bookmark className="size-5 text-sun-600" /> Modul Tersimpan ({bookmarkItems.length})
          </h2>
          {bookmarkItems.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Belum ada modul yang di-bookmark. Klik tombol &ldquo;Simpan&rdquo; saat membaca modul untuk menandainya di sini.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {bookmarkItems.map(({ key, info }) => (
                <li key={key} className="flex items-center justify-between gap-2 rounded-xl border-2 border-line bg-cream/60 p-3">
                  <Link href={`/belajar/${info!.track.slug}/${info!.stage.id}`} className="min-w-0 flex-1 hover:underline">
                    <p className="text-[11px] font-bold text-muted uppercase">{info!.track.short}</p>
                    <p className="truncate text-sm font-extrabold">{info!.stage.title}</p>
                  </Link>
                  <button type="button" onClick={() => toggleBookmark(key)} className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-[#ffe4dc]" aria-label="Hapus bookmark">
                    <Trash2 className="size-4 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <NotebookPen className="size-5 text-ink-3" /> Catatan Pribadi ({noteEntries.length})
          </h2>
          {noteEntries.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Belum ada catatan belajar. Buka tombol &ldquo;Catatan&rdquo; di halaman modul mana pun untuk menulis rangkumanmu sendiri.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {noteEntries.map(({ key, text, info }) => (
                <li key={key} className="rounded-xl border-2 border-line bg-cream/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/belajar/${info!.track.slug}/${info!.stage.id}`} className="text-xs font-extrabold text-ink-3 hover:underline">
                      {info!.track.short} · {info!.stage.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => confirm("Hapus catatan ini?") && setNote(key, "")}
                      className="text-xs font-bold text-muted hover:text-[#b4362c]"
                    >
                      Hapus
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-ink-2">{text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="font-mono text-2xl font-extrabold sm:text-4xl">{k}</p>
      <p className="mt-1 text-xs text-muted sm:text-sm">{v}</p>
    </div>
  );
}
