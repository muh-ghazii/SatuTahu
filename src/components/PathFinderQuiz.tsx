"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Compass, RotateCcw, Sparkles } from "lucide-react";
import { tracks } from "@/data";
import { TrackIcon } from "./icons";

type Question = {
  q: string;
  options: { label: string; desc: string; scores: Record<string, number> }[];
};

const QUESTIONS: Question[] = [
  {
    q: "Pengalamanmu di dunia coding / IT saat ini?",
    options: [
      { label: "Benar-benar dari nol", desc: "Belum pernah menulis kode atau baru mau mulai", scores: { fondasi: 4, web: 2, frontend: 2, "data-analyst": 2, uiux: 2 } },
      { label: "Sudah tahu dasar variabel & loop", desc: "Pernah coba Python / JS / HTML sedikit", scores: { frontend: 3, backend: 3, web: 3, "data-analyst": 3, mobile: 2, "game-dev": 2 } },
      { label: "Sudah pernah bikin proyek kecil", desc: "Ingin naik level ke spesialisasi yang lebih dalam", scores: { "ai-engineer": 3, "devops-cloud": 3, "cyber-security": 3, "data-engineering": 3, "machine-learning": 3, "deep-learning": 3 } },
    ],
  },
  {
    q: "Aktivitas mana yang paling bikin kamu bersemangat?",
    options: [
      { label: "Mendesain tampilan & interaksi visual", desc: "Suka melihat hasil langsung rapi di layar", scores: { frontend: 4, uiux: 4, mobile: 3, web: 2, "game-dev": 3 } },
      { label: "Merancang logika, API & sistem di balik layar", desc: "Suka struktur rapi, database, dan performa", scores: { backend: 4, web: 3, "devops-cloud": 3, "data-engineering": 3, "qa-testing": 2 } },
      { label: "Menganalisis angka, pola, dan kecerdasan buatan", desc: "Penasaran dengan data, ML, dan LLM/AI", scores: { "data-analyst": 4, "data-scientist": 4, "machine-learning": 4, "deep-learning": 3, "computer-vision": 3, "ai-engineer": 4 } },
      { label: "Jaringan, keamanan siber, atau perangkat keras", desc: "Suka oprek server, keamanan, atau mikrokontroler", scores: { jaringan: 4, "cyber-security": 4, "devops-cloud": 3, iot: 4 } },
    ],
  },
  {
    q: "Hasil karya impianmu dalam 6 bulan ke depan?",
    options: [
      { label: "Website / aplikasi penuh yang dipakai banyak orang", desc: "Toko online, SaaS, atau aplikasi Android/iOS", scores: { web: 4, frontend: 3, backend: 3, mobile: 4 } },
      { label: "Aplikasi AI / chatbot pintar atau deteksi visual", desc: "RAG, AI agent, atau deteksi objek kamera", scores: { "ai-engineer": 5, "computer-vision": 4, "deep-learning": 3, "machine-learning": 3 } },
      { label: "Dashboard bisnis & analisis data yang akurat", desc: "SQL, Python, visualisasi & insight keputusan", scores: { "data-analyst": 5, "data-scientist": 4, "data-engineering": 3 } },
      { label: "Game seru, sistem aman, atau alat pintar IoT", desc: "Game indie, audit keamanan, atau sensor ESP32", scores: { "game-dev": 4, "cyber-security": 4, iot: 4, "qa-testing": 3, jaringan: 3 } },
    ],
  },
  {
    q: "Bagaimana perasaanmu terhadap matematika & statistik?",
    options: [
      { label: "Suka / nyaman belajar probabilitas & matriks", desc: "Tertarik mengerti rumus di balik model", scores: { "data-scientist": 3, "machine-learning": 3, "deep-learning": 4, "computer-vision": 3 } },
      { label: "Secukupnya saja yang praktis", desc: "Lebih suka logika terapan & langsung bikin produk", scores: { web: 2, frontend: 2, backend: 2, mobile: 2, "ai-engineer": 2, "data-analyst": 2, "qa-testing": 3, "devops-cloud": 2 } },
      { label: "Lebih kuat di empati visual & kreativitas", desc: "Suka riset pengguna, tata letak, dan storytelling", scores: { uiux: 4, frontend: 2, "game-dev": 2, "data-analyst": 1 } },
    ],
  },
];

export function PathFinderQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const choose = (optIdx: number) => {
    const next = [...answers, optIdx];
    setAnswers(next);
    setStep(step + 1);
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
  };

  const done = step >= QUESTIONS.length;

  const recommendations = done
    ? (() => {
        const totals: Record<string, number> = {};
        answers.forEach((optIdx, qIdx) => {
          const sc = QUESTIONS[qIdx].options[optIdx]?.scores ?? {};
          for (const [slug, val] of Object.entries(sc)) {
            totals[slug] = (totals[slug] ?? 0) + val;
          }
        });
        return tracks
          .map((t) => ({ track: t, score: totals[t.slug] ?? 0 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
      })()
    : [];

  const maxScore = recommendations[0]?.score || 1;

  return (
    <div className="card overflow-hidden bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-sun-300 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-paper">
            <Compass className="size-5" />
          </span>
          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] uppercase">Bingung pilih dari 19 jalur?</p>
            <h3 className="text-base font-extrabold sm:text-lg">Tes Rekomendasi Jalur (1 Menit)</h3>
          </div>
        </div>
        {step > 0 && (
          <button type="button" onClick={reset} className="chip !bg-paper hover:!bg-cream">
            <RotateCcw className="size-3" /> Ulangi
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {!done ? (
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <div className="mb-4 flex items-center justify-between text-xs font-bold text-muted">
                <span>Pertanyaan {step + 1} dari {QUESTIONS.length}</span>
                <div className="flex gap-1">
                  {QUESTIONS.map((_, i) => (
                    <span key={i} className={`h-2 w-6 rounded-full border border-ink ${i <= step ? "bg-sun-400" : "bg-cream"}`} />
                  ))}
                </div>
              </div>
              <p className="text-lg font-extrabold sm:text-xl">{QUESTIONS[step].q}</p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {QUESTIONS[step].options.map((opt, idx) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => choose(idx)}
                    className="rounded-xl border-2 border-ink bg-cream/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-sun-100 hover:shadow-hard-sm active:translate-y-0"
                  >
                    <p className="font-extrabold text-ink">{opt.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.12em] text-ink-3 uppercase">
              <Sparkles className="size-4" /> Rekomendasi teratas untukmu
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {recommendations.map(({ track, score }, i) => {
                const matchPct = Math.min(99, Math.max(72, Math.round((score / maxScore) * 96 - i * 4)));
                return (
                  <div key={track.slug} className={`flex flex-col rounded-2xl border-2 border-ink p-4 ${i === 0 ? "bg-sun-100 shadow-hard-sm" : "bg-cream/60"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-paper">
                        <TrackIcon name={track.icon} className="size-5" />
                      </span>
                      <span className="rounded-lg border-2 border-ink bg-paper px-2 py-0.5 font-mono text-xs font-extrabold">
                        {matchPct}% cocok
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-extrabold">{track.name}</h4>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-2">{track.tagline}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/belajar/${track.slug}/${track.stages[0].id}`} className="btn btn-primary w-full !px-3 !py-2 !text-xs">
                        Mulai Modul 1 <ArrowRight className="size-3.5" />
                      </Link>
                      <Link href={`/jalur/${track.slug}`} className="w-full text-center text-xs font-bold text-ink-3 hover:underline">
                        Lihat roadmap lengkap
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
