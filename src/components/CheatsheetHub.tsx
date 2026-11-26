"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Copy, Layers, RotateCw, ShieldAlert, Sparkles } from "lucide-react";
import { getTrackGuide, sourcesForTrack, tracks } from "@/data";
import { recordStudyAction } from "@/lib/gamification";
import { TrackIcon } from "./icons";

export function CheatsheetHub() {
  const params = useSearchParams();
  const initial = params.get("jalur");
  const validInitial = tracks.some((t) => t.slug === initial) ? initial! : tracks[0].slug;

  const [slug, setSlug] = useState(validInitial);
  const [tab, setTab] = useState<"cheatsheet" | "flashcard">("cheatsheet");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initial && tracks.some((t) => t.slug === initial)) {
      setSlug(initial);
    }
  }, [initial]);

  useEffect(() => {
    setCardIdx(0);
    setFlipped(false);
  }, [slug]);

  const track = tracks.find((t) => t.slug === slug) ?? tracks[0];
  const guide = getTrackGuide(track.slug);
  const extSources = sourcesForTrack(track.slug).slice(0, 4);

  const copyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1600);
    } catch {
      /* abaikan bila clipboard diblokir */
    }
  };

  const cards = guide?.flashcards ?? [];
  const currentCard = cards[cardIdx];
  const cardKey = `${slug}:${cardIdx}`;
  const knownCount = cards.filter((_, i) => known[`${slug}:${i}`]).length;

  const markKnown = (val: boolean) => {
    setKnown((prev) => ({ ...prev, [cardKey]: val }));
    recordStudyAction((s) => ({ flashcardsReviewed: s.flashcardsReviewed + 1 }), val ? 10 : 5);
    setFlipped(false);
    setCardIdx((i) => (i + 1) % cards.length);
  };

  return (
    <div>
      {/* Pemilih 19 Jalur: scroll horizontal nyaman di HP */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {tracks.map((t) => {
          const active = t.slug === slug;
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => setSlug(t.slug)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border-2 border-ink px-3 py-2 text-xs font-extrabold transition-all sm:text-sm ${
                active ? "bg-sun-400 shadow-hard-sm" : "bg-paper text-muted hover:bg-sun-50 hover:text-ink"
              }`}
            >
              <TrackIcon name={t.icon} className="size-4" />
              <span>{t.short}</span>
            </button>
          );
        })}
      </div>

      {/* Header Jalur Terpilih + Switcher Cheatsheet / Flashcard */}
      <div className="card mt-6 overflow-hidden bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink bg-sun-100 p-5 sm:p-6">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-paper shadow-hard-sm">
              <TrackIcon name={track.icon} className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold sm:text-2xl">{track.name}</h2>
              <p className="mt-0.5 text-xs text-ink-2 sm:text-sm">{track.tagline}</p>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setTab("cheatsheet")}
              className={`flex-1 rounded-xl border-2 border-ink px-4 py-2 text-xs font-extrabold sm:flex-none sm:text-sm ${
                tab === "cheatsheet" ? "bg-ink text-sun-300" : "bg-paper hover:bg-sun-50"
              }`}
            >
              Cheatsheet
            </button>
            <button
              type="button"
              onClick={() => setTab("flashcard")}
              className={`flex-1 rounded-xl border-2 border-ink px-4 py-2 text-xs font-extrabold sm:flex-none sm:text-sm ${
                tab === "flashcard" ? "bg-ink text-sun-300" : "bg-paper hover:bg-sun-50"
              }`}
            >
              Flashcard ({cards.length})
            </button>
          </div>
        </div>

        {guide && (
          <div className="p-5 sm:p-6">
            {tab === "cheatsheet" ? (
              <div className="space-y-8">
                {/* Analogi & Fokus */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border-2 border-ink bg-sun-50 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.12em] text-ink-3 uppercase">
                      <Sparkles className="size-3.5" /> Pahami cepat lewat analogi
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink">{guide.analogy}</p>
                  </div>
                  <div className="rounded-2xl border-2 border-ink bg-[#dff5e7]/70 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.12em] text-[#1d7a46] uppercase">
                      <Layers className="size-3.5" /> Fokus belajar paling efektif
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink">{guide.focusTip}</p>
                  </div>
                </div>

                {/* Potongan Kode & Rumus */}
                <div>
                  <h3 className="text-lg font-extrabold">Contekan Syntax, Perintah &amp; Pola Wajib</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {guide.cheats.map((c, idx) => (
                      <div key={c.title} className="flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-hard-sm">
                        <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-cream px-4 py-2.5">
                          <span className="text-sm font-extrabold">{c.title}</span>
                          <button
                            type="button"
                            onClick={() => copyCode(c.code, idx)}
                            className="flex items-center gap-1 rounded-lg border border-ink/30 bg-paper px-2 py-1 text-[11px] font-bold hover:bg-sun-100"
                          >
                            {copiedIdx === idx ? <><Check className="size-3 text-[#1d7a46]" /> Disalin</> : <><Copy className="size-3" /> Salin</>}
                          </button>
                        </div>
                        <pre className="overflow-x-auto bg-ink p-4 font-mono text-xs leading-relaxed text-paper sm:text-[13px]">
                          <code>{c.code}</code>
                        </pre>
                        <p className="mt-auto border-t border-line bg-paper px-4 py-2.5 text-xs leading-relaxed text-muted">{c.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kesalahan Umum */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-extrabold">
                    <ShieldAlert className="size-5 text-[#b4362c]" /> Kesalahan Umum Pemula &amp; Solusinya
                  </h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {guide.mistakes.map((m, idx) => (
                      <div key={idx} className="rounded-2xl border-2 border-ink bg-cream/60 p-4 text-sm">
                        <p className="font-bold text-ink">✗ {m.wrong}</p>
                        <p className="mt-2 text-xs leading-relaxed text-ink-2">
                          <span className="font-extrabold text-[#1d7a46]">✓ Solusi:</span> {m.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sumber & Tautan */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-line pt-5">
                  <div className="flex flex-wrap gap-2">
                    {extSources.map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chip !bg-sun-50 hover:!bg-sun-200"
                      >
                        {s.title} ↗
                      </a>
                    ))}
                  </div>
                  <Link href={`/jalur/${track.slug}`} className="btn btn-primary !py-2 !text-xs">
                    Buka Roadmap {track.short} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Mode Flashcard Interaktif */
              <div className="mx-auto max-w-2xl py-2">
                <div className="mb-4 flex items-center justify-between text-xs font-bold text-muted">
                  <span>Kartu {cardIdx + 1} dari {cards.length}</span>
                  <span>Sudah hafal: <strong className="text-ink">{knownCount}/{cards.length}</strong></span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
                  <div className="h-full bg-sun-400 transition-all" style={{ width: `${((cardIdx + 1) / Math.max(cards.length, 1)) * 100}%` }} />
                </div>

                {currentCard && (
                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className={`mt-6 flex min-h-[230px] w-full flex-col justify-between rounded-3xl border-2 border-ink p-6 text-left shadow-hard transition-colors sm:min-h-[260px] sm:p-8 ${
                      flipped ? "bg-[#dff5e7]" : "bg-sun-100 hover:bg-sun-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="chip !bg-paper">{flipped ? "Jawaban" : "Pertanyaan"}</span>
                      <span className="flex items-center gap-1 text-xs font-bold text-ink-2">
                        <RotateCw className="size-3.5" /> Tap untuk balik
                      </span>
                    </div>
                    <p className={`my-6 leading-relaxed font-extrabold ${flipped ? "text-base text-ink sm:text-lg" : "text-xl text-ink sm:text-2xl"}`}>
                      {flipped ? currentCard.a : currentCard.q}
                    </p>
                    <p className="text-xs font-semibold text-muted">
                      {known[cardKey] ? "✓ Sudah ditandai hafal" : flipped ? "Beri nilai pemahamanmu di bawah (+XP)" : "Pikirkan dulu jawabannya sebelum membuka!"}
                    </p>
                  </button>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFlipped(false);
                        setCardIdx((i) => (i - 1 + cards.length) % cards.length);
                      }}
                      className="btn btn-ghost !px-3.5 !py-2"
                      aria-label="Kartu sebelumnya"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFlipped(false);
                        setCardIdx((i) => (i + 1) % cards.length);
                      }}
                      className="btn btn-ghost !px-3.5 !py-2"
                      aria-label="Kartu berikutnya"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>

                  <div className="flex flex-1 justify-end gap-2">
                    <button type="button" onClick={() => markKnown(false)} className="btn btn-ghost !px-4 !py-2 !text-xs sm:!text-sm">
                      Ulangi lagi (+5 XP)
                    </button>
                    <button type="button" onClick={() => markKnown(true)} className="btn btn-primary !px-4 !py-2 !text-xs sm:!text-sm">
                      <Check className="size-4" /> Sudah hafal (+10 XP)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
