"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BookMarked, BookOpen, Code2, CornerDownLeft, FileCode2, Gamepad2, Search, Star } from "lucide-react";
import { buildCatalog, externalSources, formatStars, repoUrl, tracks } from "@/data";
import { GitHubMark, TrackIcon } from "./icons";

type Item =
  | { type: "feature"; id: string; title: string; sub: string; href: string }
  | { type: "track"; id: string; title: string; sub: string; icon: string; href: string }
  | { type: "stage"; id: string; title: string; sub: string; href: string }
  | { type: "external"; id: string; title: string; sub: string; href: string }
  | { type: "repo"; id: string; title: string; sub: string; stars: number; href: string };

const catalog = buildCatalog();
const featureItems: Item[] = [
  { type: "feature", id: "game", title: "Arena Game Coding", sub: "Tahu Bot, Susun Kode, Bug Hunter & SQL/Git/CSS Quest", href: "/game" },
  { type: "feature", id: "playground", title: "Coding Playground Live", sub: "Tulis & jalankan HTML, CSS, JavaScript + tantangan otomatis", href: "/playground" },
  { type: "feature", id: "cheatsheet", title: "Cheatsheet & Flashcard 19 Jalur", sub: "Contekan syntax, perintah, jebakan pemula & 114 flashcard", href: "/cheatsheet" },
];
const allItems: Item[] = [
  ...featureItems,
  ...tracks.map((t) => ({ type: "track" as const, id: t.slug, title: t.name, sub: t.tagline, icon: t.icon, href: `/jalur/${t.slug}` })),
  ...tracks.flatMap((t) =>
    t.stages.map((s) => ({ type: "stage" as const, id: s.id, title: s.title, sub: `Modul ${t.short} · ${s.topics.join(", ")}`, href: `/belajar/${t.slug}/${s.id}` })),
  ),
  ...externalSources.map((e) => ({ type: "external" as const, id: e.id, title: e.title, sub: `${e.author} · ${e.note}`, href: e.url })),
  ...catalog.map((c) => ({ type: "repo" as const, id: c.repo, title: c.repo, sub: c.note, stars: c.stars, href: repoUrl(c.repo) })),
];

function score(item: Item, q: string) {
  const t = item.title.toLowerCase();
  const s = item.sub.toLowerCase();
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  if (s.includes(q)) return 1;
  return 0;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return allItems.filter((i) => i.type === "track");
    return allItems
      .map((i) => ({ i, s: score(i, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 24)
      .map((x) => x.i);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item: Item) => {
    onClose();
    if (item.type === "repo" || item.type === "external") window.open(item.href, "_blank", "noopener,noreferrer");
    else router.push(item.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) go(results[active]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Pencarian"
            className="card relative w-full max-w-xl overflow-hidden !shadow-hard-lg"
            initial={{ y: -12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            onKeyDown={onKey}
          >
            <div className="flex items-center gap-3 border-b-2 border-ink px-4">
              <Search className="size-5 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari jalur, modul, topik, atau repo… (mis. YOLO, SQL, React)"
                className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted/70"
              />
              <kbd className="rounded-md border border-ink/30 px-1.5 font-mono text-[11px]">Esc</kbd>
            </div>
            <ul ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {!q && <li className="px-3 pb-1 pt-2 text-[11px] font-bold tracking-widest text-muted uppercase">Semua jalur</li>}
              {results.length === 0 && <li className="px-3 py-10 text-center text-sm text-muted">Tidak ada hasil untuk “{q}”.</li>}
              {results.map((item, idx) => (
                <li key={item.type + item.id} data-idx={idx}>
                  <button
                    onMouseMove={() => setActive(idx)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${active === idx ? "bg-sun-100" : ""}`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border-[1.5px] border-ink bg-paper">
                      {item.type === "feature" && item.id === "game" && <Gamepad2 className="size-4" />}
                      {item.type === "feature" && item.id === "playground" && <Code2 className="size-4" />}
                      {item.type === "feature" && item.id === "cheatsheet" && <FileCode2 className="size-4" />}
                      {item.type === "track" && <TrackIcon name={item.icon} className="size-4" />}
                      {item.type === "stage" && <BookOpen className="size-4" />}
                      {item.type === "external" && <BookMarked className="size-4" />}
                      {item.type === "repo" && <GitHubMark className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.title}</span>
                      <span className="block truncate text-xs text-muted">{item.sub}</span>
                    </span>
                    {item.type === "repo" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                        <Star className="size-3.5 fill-sun-400 text-sun-600" /> {formatStars(item.stars)}
                      </span>
                    )}
                    {active === idx && <CornerDownLeft className="size-4 text-muted" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t-2 border-ink bg-cream px-4 py-2 text-[11px] text-muted">
              <span>↑↓ navigasi · Enter buka</span>
              <span>{allItems.length} item terindeks</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
