"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Star } from "lucide-react";
import { formatStars, repoMeta, trackStats, tracks } from "@/data";

const demo = ["ai-engineer", "frontend", "computer-vision", "data-engineering", "mobile", "jaringan"].map((s) => tracks.find((t) => t.slug === s)!);

function Terminal() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const t = demo[idx];
  const cmd = `satutahu mulai --jalur ${t.slug}`;
  const done = typed.length >= cmd.length;

  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(cmd.slice(0, i));
      if (i >= cmd.length) clearInterval(id);
    }, 38);
    const next = setTimeout(() => setIdx((v) => (v + 1) % demo.length), 5200);
    return () => { clearInterval(id); clearTimeout(next); };
  }, [idx, cmd]);

  const s = trackStats(t);
  const first = t.stages[0];
  return (
    <div className="card w-full overflow-hidden !bg-ink text-paper !shadow-hard-lg">
      <div className="flex items-center gap-1.5 border-b-2 border-ink bg-ink-2 px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff6b5b]" />
        <span className="size-3 rounded-full bg-sun-400" />
        <span className="size-3 rounded-full bg-[#4fd27a]" />
        <span className="ml-3 font-mono text-[11px] text-paper/50">~/belajar</span>
      </div>
      <div className="min-h-[188px] p-4 font-mono text-[12.5px] leading-6 sm:text-[13px]">
        <p>
          <span className="text-sun-400">❯</span> {typed}
          {!done && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-sun-400" />}
        </p>
        <AnimatePresence mode="wait">
          {done && (
            <motion.div key={t.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ staggerChildren: 0.1 }}>
              <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="text-[#4fd27a]">✓ {t.name}</motion.p>
              <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="text-paper/70">
                {s.stages} modul · {s.topics} topik · {s.repos} repo rujukan
              </motion.p>
              <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="mt-1">
                <span className="text-sun-300">→ Tahap 1:</span> {first.title}
              </motion.p>
              {first.resources.slice(0, 2).map((r, i) => (
                <motion.p key={r.repo} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.12 }} className="truncate pl-4 text-paper/80">
                  {r.repo} <span className="text-sun-400">★ {formatStars(repoMeta(r.repo).stars)}</span>
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Hero({ stats }: { stats: { tracks: number; repos: number; external?: number; stars: number; stages: number } }) {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_70%)]" />
      <div className="container-page relative grid items-center gap-12 pt-10 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-24">
        <div>
          <span className="eyebrow enter">
            <span className="size-2 rounded-full bg-[#2fb36b]" /> 100% gratis · materi berbahasa Indonesia
          </span>
          <h1
            style={{ "--d": "0.04s" } as CSSProperties}
            className="enter mt-5 text-[40px] leading-[1.04] font-extrabold tracking-[-0.025em] text-balance sm:text-6xl lg:text-[68px]"
          >
            Belajar teknologi dari sumber{" "}
            <span className="whitespace-nowrap"><span className="relative inline-block">
              <span className="relative z-10">terbaik</span>
              <svg className="absolute -bottom-1 left-0 z-0 h-4 w-full sm:h-5" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden>
                <motion.path d="M3 14 C 50 4, 120 4, 197 12" fill="none" stroke="var(--color-sun-400)" strokeWidth="10" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.6 }} />
              </svg>
            </span>,</span> langsung di satu tempat.
          </h1>
          <p style={{ "--d": "0.08s" } as CSSProperties} className="enter mt-6 max-w-xl text-base leading-relaxed text-muted text-pretty sm:text-lg">
            Materi gratis terbaik dari GitHub, buku terbuka, dan web resmi kami rangkai menjadi {stats.stages} modul berbahasa Indonesia dalam {stats.tracks} jalur. Lengkap dengan visualisasi interaktif, Arena Game Coding, Coding Playground, Cheatsheet &amp; Flashcard, serta pelacak progres &amp; XP.
          </p>
          <div style={{ "--d": "0.12s" } as CSSProperties} className="enter mt-7 flex flex-wrap gap-3 sm:mt-8">
            <Link href="/jalur" className="btn btn-primary flex-1 !px-5 !py-3 !text-sm sm:flex-none sm:!px-6 sm:!py-3.5 sm:!text-base">
              Pilih Jalur <ArrowRight className="size-4 sm:size-5" />
            </Link>
            <Link href="/game" className="btn btn-dark flex-1 !px-5 !py-3 !text-sm sm:flex-none sm:!px-6 sm:!py-3.5 sm:!text-base">
              Main Game Coding
            </Link>
            <Link href="/playground" className="btn btn-ghost w-full !px-5 !py-3 !text-sm sm:w-auto sm:!px-6 sm:!py-3.5 sm:!text-base">
              Coding Playground
            </Link>
          </div>
          <dl style={{ "--d": "0.16s" } as CSSProperties} className="enter mt-9 grid max-w-lg grid-cols-3 divide-x-2 divide-ink/10 sm:mt-10">
            {[
              { k: `${stats.tracks}`, v: "jalur belajar" },
              { k: `${stats.stages}`, v: "modul interaktif" },
              { k: `${stats.repos + (stats.external ?? 0)}+`, v: "repo, buku & web" },
            ].map((s) => (
              <div key={s.v} className="px-3 first:pl-0 sm:px-4">
                <dt className="text-2xl font-extrabold tracking-tight sm:text-3xl">{s.k}</dt>
                <dd className="mt-0.5 text-xs text-muted sm:text-sm">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="enter relative">
            <div className="absolute inset-x-6 top-4 bottom-24 rounded-[40px] border-2 border-ink bg-sun-400" />
            <Image src="/hero-mascot.png" alt="Maskot SatuTahu: tahu bertoga yang sedang membaca buku" width={720} height={567} priority className="relative z-10 mx-auto w-[88%] pt-2 animate-float drop-shadow-[6px_6px_0_rgba(18,32,58,0.15)]" />
          </div>
          <div style={{ "--d": "0.12s" } as CSSProperties} className="enter relative z-20 -mt-12 sm:-mt-24">
            <Terminal />
          </div>
          <div
            style={{ "--d": "0.2s" } as CSSProperties}
            className="enter absolute top-6 -right-2 z-20 rotate-[4deg] hidden rounded-xl border-2 border-ink bg-paper px-3 py-2 shadow-hard-sm sm:block"
          >
            <p className="text-[11px] font-semibold text-muted">ossu/computer-science</p>
            <p className="flex items-center gap-1 text-sm font-extrabold"><Star className="size-4 fill-sun-400 text-sun-600" /> {formatStars(repoMeta("ossu/computer-science").stars)} bintang</p>
          </div>
          <div
            style={{ "--d": "0.24s" } as CSSProperties}
            className="enter absolute top-[38%] -left-4 z-20 -rotate-[4deg] hidden rounded-xl border-2 border-ink bg-paper px-3 py-2 shadow-hard-sm sm:block"
          >
            <p className="text-[11px] font-semibold text-muted">Lacak progresmu</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-20 overflow-hidden rounded-full border border-ink bg-cream">
                <motion.div className="h-full bg-sun-400" initial={{ width: 0 }} animate={{ width: "64%" }} transition={{ delay: 0.4, duration: 0.8 }} />
              </div>
              <span className="text-sm font-extrabold">64%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
