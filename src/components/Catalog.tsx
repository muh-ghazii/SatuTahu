"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { buildCatalog, kindLabel, tracks, type ResourceKind } from "@/data";
import { RepoCard } from "./RepoCard";
import { IdFlag } from "./icons";

const catalog = buildCatalog();
const kinds = Object.keys(kindLabel) as ResourceKind[];

export function Catalog() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<ResourceKind | "all">("all");
  const [track, setTrack] = useState<string>("all");
  const [lang, setLang] = useState<"all" | "ID" | "EN">("all");
  const [sort, setSort] = useState<"stars" | "name">("stars");
  const [limit, setLimit] = useState(30);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const r = catalog.filter((c) => {
      if (kind !== "all" && c.kind !== kind) return false;
      if (track !== "all" && !c.tracks.some((t) => t.slug === track)) return false;
      if (lang !== "all" && c.lang !== lang) return false;
      if (query && !(`${c.repo} ${c.desc} ${c.note}`.toLowerCase().includes(query))) return false;
      return true;
    });
    return sort === "name" ? [...r].sort((a, b) => a.repo.localeCompare(b.repo)) : r;
  }, [q, kind, track, lang, sort]);

  const active = kind !== "all" || track !== "all" || lang !== "all" || q;

  return (
    <div>
      <div className="card sticky top-[84px] z-20 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-xl border-2 border-ink bg-cream px-3">
            <Search className="size-4 text-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(30); }} placeholder="Cari repo, topik, atau kata kunci… (mis. pandas, kubernetes, YOLO)" className="h-11 w-full bg-transparent text-sm outline-none" />
            {q && <button onClick={() => setQ("")} aria-label="Hapus pencarian"><X className="size-4" /></button>}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="hidden size-4 text-muted lg:block" />
            <Select value={track} onChange={(v) => { setTrack(v); setLimit(30); }} label="Jalur" options={[["all", "Semua jalur"], ...tracks.map((t) => [t.slug, t.short] as [string, string])]} />
            <Select value={sort} onChange={(v) => setSort(v as "stars" | "name")} label="Urutkan" options={[["stars", "Bintang terbanyak"], ["name", "Nama A–Z"]]} />
            <div role="group" aria-label="Bahasa materi" className="flex overflow-hidden rounded-xl border-2 border-ink bg-paper text-sm font-semibold">
              {([["all", "Semua bahasa"], ["ID", "Indonesia"], ["EN", "English"]] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => { setLang(v); setLimit(30); }}
                  aria-pressed={lang === v}
                  className={`flex h-9 items-center gap-1.5 border-l-2 border-ink px-3 first:border-l-0 ${lang === v ? "bg-ink text-paper" : "hover:bg-sun-50"}`}
                >
                  {v === "ID" && <IdFlag />}{l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {(["all", ...kinds] as const).map((k) => (
            <button key={k} onClick={() => { setKind(k); setLimit(30); }} className={`chip shrink-0 !px-3 !py-1.5 transition-colors ${kind === k ? "!bg-sun-400" : "hover:bg-sun-50"}`}>
              {k === "all" ? "Semua jenis" : kindLabel[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <p className="text-muted"><span className="font-bold text-ink">{results.length}</span> repo ditemukan</p>
        {active && (
          <button onClick={() => { setQ(""); setKind("all"); setTrack("all"); setLang("all"); }} className="font-bold text-ink-3 hover:underline">Reset filter</button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-ink/40 p-12 text-center">
          <p className="font-bold">Tidak ada repo yang cocok.</p>
          <p className="mt-1 text-sm text-muted">Coba kata kunci lain atau reset filter.</p>
        </div>
      ) : (
        <motion.div layout className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {results.slice(0, limit).map((c) => (
              <motion.div key={c.repo} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
                <RepoCard r={c} tracks={c.tracks} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {results.length > limit && (
        <div className="mt-10 text-center">
          <button onClick={() => setLimit((l) => l + 30)} className="btn btn-ghost">Tampilkan lebih banyak ({results.length - limit} lagi)</button>
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 cursor-pointer appearance-none rounded-xl border-2 border-ink bg-paper pr-8 pl-3 text-sm font-semibold outline-none hover:bg-sun-50">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">▾</span>
    </label>
  );
}
