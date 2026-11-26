"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, BookMarked, ChevronDown, Globe, GraduationCap, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import {
  buildCatalog,
  externalSources,
  externalTypeLabel,
  kindLabel,
  tracks,
  type ExternalSource,
  type ExternalSourceType,
  type ResourceKind,
} from "@/data";
import { RepoCard } from "./RepoCard";
import { GitHubMark, IdFlag } from "./icons";

const catalog = buildCatalog();
const kinds = Object.keys(kindLabel) as ResourceKind[];
const extTypes = Object.keys(externalTypeLabel) as ExternalSourceType[];
const trackMap = new Map(tracks.map((t) => [t.slug, t.short]));

type SourceTab = "github" | "external";

export function Catalog() {
  const [sourceTab, setSourceTab] = useState<SourceTab>("github");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<ResourceKind | "all">("all");
  const [extType, setExtType] = useState<ExternalSourceType | "all">("all");
  const [track, setTrack] = useState<string>("all");
  const [lang, setLang] = useState<"all" | "ID" | "EN">("all");
  const [sort, setSort] = useState<"stars" | "name">("stars");
  const [limit, setLimit] = useState(30);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const repoResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    const r = catalog.filter((c) => {
      if (kind !== "all" && c.kind !== kind) return false;
      if (track !== "all" && !c.tracks.some((t) => t.slug === track)) return false;
      if (lang !== "all" && c.lang !== lang) return false;
      if (query && !`${c.repo} ${c.desc} ${c.note}`.toLowerCase().includes(query)) return false;
      return true;
    });
    return sort === "name" ? [...r].sort((a, b) => a.repo.localeCompare(b.repo)) : r;
  }, [q, kind, track, lang, sort]);

  const extResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    return externalSources.filter((s) => {
      if (extType !== "all" && s.type !== extType) return false;
      if (track !== "all" && !s.tracks.includes(track)) return false;
      if (lang !== "all" && s.lang !== lang) return false;
      if (query && !`${s.title} ${s.author} ${s.note} ${s.url}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [q, extType, track, lang]);

  const activeFilterCount =
    (track !== "all" ? 1 : 0) +
    (lang !== "all" ? 1 : 0) +
    (sourceTab === "github" ? (kind !== "all" ? 1 : 0) : extType !== "all" ? 1 : 0);

  const active = activeFilterCount > 0 || q.trim().length > 0;
  const totalShown = sourceTab === "github" ? repoResults.length : extResults.length;

  const resetFilters = () => {
    setQ("");
    setKind("all");
    setExtType("all");
    setTrack("all");
    setLang("all");
  };

  return (
    <div>
      {/* Switcher Sumber: GitHub vs Buku & Web */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:inline-flex sm:gap-2">
        <button
          onClick={() => {
            setSourceTab("github");
            setLimit(30);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 text-sm font-extrabold transition-all ${
            sourceTab === "github" ? "bg-sun-400 shadow-hard-sm" : "bg-paper text-muted hover:bg-sun-50 hover:text-ink"
          }`}
        >
          <GitHubMark className="size-4" />
          <span>Repo GitHub</span>
          <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[11px] text-sun-300">{catalog.length}</span>
        </button>
        <button
          onClick={() => setSourceTab("external")}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 text-sm font-extrabold transition-all ${
            sourceTab === "external" ? "bg-sun-400 shadow-hard-sm" : "bg-paper text-muted hover:bg-sun-50 hover:text-ink"
          }`}
        >
          <BookMarked className="size-4" />
          <span>Buku &amp; Web</span>
          <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[11px] text-sun-300">{externalSources.length}</span>
        </button>
      </div>

      {/* Kotak Pencarian & Filter: di HP ringkas dengan toggle filter agar tidak menutupi layar */}
      <div className="card z-20 p-3 sm:p-4 lg:sticky lg:top-[84px]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-xl border-2 border-ink bg-cream px-3">
              <Search className="size-4 shrink-0 text-muted" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setLimit(30);
                }}
                placeholder={
                  sourceTab === "github"
                    ? "Cari repo, topik, atau kata kunci… (mis. pandas, YOLO, SQL)"
                    : "Cari buku, dokumentasi, atau lab… (mis. MDN, OSTEP, SQLBolt)"
                }
                className="h-11 w-full bg-transparent text-base outline-none sm:text-sm"
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Hapus pencarian" className="grid size-7 place-items-center rounded-md hover:bg-sun-100">
                  <X className="size-4" />
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex h-11 shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3 text-sm font-bold lg:hidden ${
                filtersOpen || activeFilterCount > 0 ? "bg-sun-300" : "bg-paper"
              }`}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="size-4" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-ink font-mono text-[11px] text-sun-300">{activeFilterCount}</span>
              )}
              <ChevronDown className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className={`${filtersOpen ? "flex" : "hidden"} flex-wrap items-center gap-2 lg:flex`}>
            <SlidersHorizontal className="hidden size-4 text-muted lg:block" />
            <Select
              value={track}
              onChange={(v) => {
                setTrack(v);
                setLimit(30);
              }}
              label="Jalur"
              options={[["all", "Semua jalur"], ...tracks.map((t) => [t.slug, t.short] as [string, string])]}
            />
            {sourceTab === "github" && (
              <Select
                value={sort}
                onChange={(v) => setSort(v as "stars" | "name")}
                label="Urutkan"
                options={[
                  ["stars", "Bintang terbanyak"],
                  ["name", "Nama A–Z"],
                ]}
              />
            )}
            <div role="group" aria-label="Bahasa materi" className="flex overflow-hidden rounded-xl border-2 border-ink bg-paper text-sm font-semibold">
              {(
                [
                  ["all", "Semua"],
                  ["ID", "ID"],
                  ["EN", "EN"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => {
                    setLang(v);
                    setLimit(30);
                  }}
                  aria-pressed={lang === v}
                  className={`flex h-10 items-center gap-1.5 border-l-2 border-ink px-3 first:border-l-0 ${lang === v ? "bg-ink text-paper" : "hover:bg-sun-50"}`}
                >
                  {v === "ID" && <IdFlag />}
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {sourceTab === "github"
            ? (["all", ...kinds] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setKind(k);
                    setLimit(30);
                  }}
                  className={`chip shrink-0 !px-3 !py-1.5 transition-colors ${kind === k ? "!bg-sun-400" : "hover:bg-sun-50"}`}
                >
                  {k === "all" ? "Semua jenis" : kindLabel[k]}
                </button>
              ))
            : (["all", ...extTypes] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setExtType(k)}
                  className={`chip shrink-0 !px-3 !py-1.5 transition-colors ${extType === k ? "!bg-sun-400" : "hover:bg-sun-50"}`}
                >
                  {k === "all" ? "Semua kategori" : externalTypeLabel[k]}
                </button>
              ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <p className="text-muted">
          <span className="font-bold text-ink">{totalShown}</span> {sourceTab === "github" ? "repo GitHub" : "buku & web rujukan"} ditemukan
        </p>
        {active && (
          <button onClick={resetFilters} className="font-bold text-ink-3 hover:underline">
            Reset filter
          </button>
        )}
      </div>

      {totalShown === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-ink/40 p-12 text-center">
          <p className="font-bold">Tidak ada sumber yang cocok.</p>
          <p className="mt-1 text-sm text-muted">Coba kata kunci lain atau reset filter.</p>
        </div>
      ) : sourceTab === "github" ? (
        <>
          <motion.div layout className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {repoResults.slice(0, limit).map((c) => (
                <motion.div key={c.repo} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
                  <RepoCard r={c} tracks={c.tracks} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {repoResults.length > limit && (
            <div className="mt-10 text-center">
              <button onClick={() => setLimit((l) => l + 30)} className="btn btn-ghost">
                Tampilkan lebih banyak ({repoResults.length - limit} lagi)
              </button>
            </div>
          )}
        </>
      ) : (
        <motion.div layout className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {extResults.map((s) => (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
                <ExternalSourceCard source={s} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

const extBadgeColor: Record<ExternalSourceType, string> = {
  buku: "bg-[#cfe3ff]",
  web: "bg-[#ece4ff]",
  kursus: "bg-sun-300",
  interaktif: "bg-[#d5f2df]",
};

function ExtIcon({ type }: { type: ExternalSourceType }) {
  if (type === "buku") return <BookMarked className="size-[18px]" />;
  if (type === "kursus") return <GraduationCap className="size-[18px]" />;
  if (type === "interaktif") return <Sparkles className="size-[18px]" />;
  return <Globe className="size-[18px]" />;
}

export function ExternalSourceCard({ source, showTracks = true }: { source: ExternalSource; showTracks?: boolean }) {
  return (
    <div className="group card card-hover relative flex h-full flex-col gap-3 !rounded-xl !shadow-hard-sm p-4 hover:!shadow-hard focus-within:!shadow-hard">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg border-2 border-ink ${extBadgeColor[source.type]}`}>
            <ExtIcon type={source.type} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">{source.author}</p>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[15px] leading-tight font-bold [overflow-wrap:anywhere] outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-sun-400"
            >
              {source.title}
              <span className="sr-only"> (buka di tab baru)</span>
            </a>
          </div>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
      </div>
      <p className="text-sm leading-relaxed text-ink-2">{source.note}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <span className={`chip !py-0.5 ${extBadgeColor[source.type]}`}>{externalTypeLabel[source.type]}</span>
        <span className={`chip !py-0.5 ${source.lang === "ID" ? "bg-[#ffd6d6]" : ""}`}>
          {source.lang === "ID" ? (
            <>
              <IdFlag /> Indonesia
            </>
          ) : (
            "English"
          )}
        </span>
        <span className={`ml-auto chip !py-0.5 ${source.free ? "bg-[#dff5e7]" : "!border-dashed"}`}>
          {source.free ? "Gratis" : "Buku berbayar"}
        </span>
      </div>
      {showTracks && source.tracks.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1.5 border-t-2 border-ink/10 pt-3">
          {source.tracks.map((slug) => (
            <Link key={slug} href={`/jalur/${slug}`} className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink-2 hover:bg-sun-200">
              #{trackMap.get(slug) ?? slug}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return (
    <label className="relative flex-1 sm:flex-none">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-xl border-2 border-ink bg-paper pr-8 pl-3 text-sm font-semibold outline-none hover:bg-sun-50 sm:w-auto"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">▾</span>
    </label>
  );
}
