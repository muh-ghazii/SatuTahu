"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { categories, tracks, type Category } from "@/data";
import { TrackCard } from "./TrackCard";

type Tab = "all" | Category;

export function TrackExplorer() {
  const [tab, setTab] = useState<Tab>("all");
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "Semua", count: tracks.length },
    ...categories.map((c) => ({ id: c.id as Tab, label: c.label, count: tracks.filter((t) => t.category === c.id).length })),
  ];
  const shown = tab === "all" ? tracks : tracks.filter((t) => t.category === tab);

  return (
    <div>
      <div className="no-scrollbar -mx-5 flex justify-start overflow-x-auto px-5 sm:mx-0 sm:justify-center sm:px-0">
        <div role="tablist" className="inline-flex gap-1 rounded-2xl border-2 border-ink bg-paper p-1.5 shadow-hard-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="relative rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap"
            >
              {tab === t.id && <motion.span layoutId="track-tab" className="absolute inset-0 rounded-xl bg-sun-400" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative flex items-center gap-2">
                {t.label}
                <span className={`rounded-md px-1.5 text-[11px] ${tab === t.id ? "bg-ink text-sun-300" : "bg-cream text-muted"}`}>{t.count}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((t, i) => (
            <motion.div
              key={t.slug}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, delay: i * 0.025 }}
            >
              <TrackCard t={t} />
            </motion.div>
          ))}
          {tab === "all" && (
            <motion.div key="filler" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="sm:col-span-2 lg:col-span-2">
              <Link href="/katalog" className="group flex h-full min-h-[220px] flex-col justify-between rounded-2xl border-2 border-dashed border-ink/50 bg-sun-50 p-6 transition-colors hover:border-ink hover:bg-sun-100">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.14em] text-ink-3 uppercase">Belum ketemu yang pas?</p>
                  <p className="mt-2 max-w-md text-2xl leading-snug font-extrabold">Jelajahi semua repo di katalog dan cari berdasarkan topik.</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 font-bold">Buka katalog <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
