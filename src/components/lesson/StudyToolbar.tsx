"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Bookmark,
  BookOpen,
  Code2,
  Download,
  FileCode2,
  List,
  Maximize2,
  Minimize2,
  NotebookPen,
  Type,
  X,
} from "lucide-react";
import type { Track } from "@/data/types";
import { moduleKey, useStudyTools } from "@/lib/study-tools";
import { ModuleNav } from "./LessonProgress";

type TocItem = { id: string; text: string; level: 2 | 3 };

/**
 * Toolbar belajar di halaman modul:
 * - Bookmark modul
 * - Catatan pribadi per modul (auto-save + unduh .md)
 * - Mode baca: ukuran teks (Kecil / Normal / Besar) & Mode Fokus
 * - Di HP: menyediakan floating bar + bottom sheet untuk Daftar Isi (TOC) & Daftar Modul
 */
export function StudyToolbar({
  track,
  stageId,
  title,
  toc,
}: {
  track: Track;
  stageId: string;
  title: string;
  toc: TocItem[];
}) {
  const key = moduleKey(track.slug, stageId);
  const { state, toggleBookmark, setNote, setPrefs } = useStudyTools();
  const [sheet, setSheet] = useState<null | "toc" | "modules" | "notes">(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const bookmarked = mounted && state.bookmarks.includes(key);
  const note = mounted ? state.notes[key] ?? "" : "";
  const fontSize = mounted ? state.prefs.fontSize : "md";
  const focusMode = mounted ? state.prefs.focusMode : false;

  // Terapkan atribut data di <article> / document untuk mode baca & fokus tanpa re-render server Markdown
  useEffect(() => {
    const root = document.getElementById("lesson-shell");
    if (!root) return;
    root.dataset.fontSize = fontSize;
    root.dataset.focus = focusMode ? "true" : "false";
    return () => {
      delete root.dataset.fontSize;
      delete root.dataset.focus;
    };
  }, [fontSize, focusMode]);

  const cycleFont = () => {
    const order: ("sm" | "md" | "lg")[] = ["sm", "md", "lg"];
    const next = order[(order.indexOf(fontSize) + 1) % order.length];
    setPrefs({ fontSize: next });
  };

  const downloadNote = () => {
    if (!note.trim()) return;
    const blob = new Blob([`# Catatan: ${title}\n\nJalur: ${track.name}\n\n${note}\n`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catatan-${track.slug}-${stageId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Toolbar atas di dalam halaman modul */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-ink bg-paper p-2.5 shadow-hard-sm">
        <button
          type="button"
          onClick={() => toggleBookmark(key)}
          className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition-colors ${
            bookmarked ? "border-ink bg-sun-400 text-ink" : "border-line bg-cream hover:border-ink"
          }`}
          aria-pressed={bookmarked}
        >
          <Bookmark className={`size-3.5 ${bookmarked ? "fill-ink" : ""}`} />
          <span>{bookmarked ? "Tersimpan" : "Simpan"}</span>
        </button>

        <button
          type="button"
          onClick={() => setSheet("notes")}
          className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition-colors ${
            note.trim() ? "border-ink bg-[#dff5e7]" : "border-line bg-cream hover:border-ink"
          }`}
        >
          <NotebookPen className="size-3.5" />
          <span>Catatan{note.trim() ? " •" : ""}</span>
        </button>

        <button
          type="button"
          onClick={cycleFont}
          className="flex items-center gap-1.5 rounded-xl border-2 border-line bg-cream px-3 py-2 text-xs font-extrabold hover:border-ink"
          title="Ubah ukuran huruf bacaan"
        >
          <Type className="size-3.5" />
          <span>Teks: {fontSize === "sm" ? "Kecil" : fontSize === "lg" ? "Besar" : "Normal"}</span>
        </button>

        <button
          type="button"
          onClick={() => setPrefs({ focusMode: !focusMode })}
          className={`hidden items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition-colors lg:flex ${
            focusMode ? "border-ink bg-ink text-sun-300" : "border-line bg-cream hover:border-ink"
          }`}
          aria-pressed={focusMode}
        >
          {focusMode ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          <span>{focusMode ? "Keluar Fokus" : "Mode Fokus"}</span>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href={`/cheatsheet?jalur=${track.slug}`}
            className="flex items-center gap-1.5 rounded-xl border-2 border-line bg-sun-50 px-3 py-2 text-xs font-extrabold hover:border-ink"
          >
            <FileCode2 className="size-3.5" />
            <span className="hidden sm:inline">Cheatsheet</span>
          </Link>
          <Link
            href="/playground"
            className="flex items-center gap-1.5 rounded-xl border-2 border-line bg-sun-50 px-3 py-2 text-xs font-extrabold hover:border-ink"
          >
            <Code2 className="size-3.5" />
            <span className="hidden sm:inline">Playground</span>
          </Link>
        </div>
      </div>

      {/* Bar cepat khusus HP: TOC & Daftar Modul mudah dijangkau jempol */}
      <div className="mb-6 grid grid-cols-2 gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setSheet("toc")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-sun-100 px-3 py-2.5 text-xs font-extrabold shadow-hard-sm active:translate-y-0.5"
        >
          <List className="size-4" /> Daftar Isi ({toc.length})
        </button>
        <button
          type="button"
          onClick={() => setSheet("modules")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-2.5 text-xs font-extrabold shadow-hard-sm active:translate-y-0.5"
        >
          <BookOpen className="size-4" /> Modul {track.short}
        </button>
      </div>

      {/* Bottom Sheet / Drawer untuk TOC, Modul, dan Catatan */}
      <AnimatePresence>
        {sheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          >
            <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={() => setSheet(null)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="relative z-10 flex max-h-[82dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-t-2 border-ink bg-paper shadow-hard-lg sm:rounded-2xl sm:border-2"
            >
              <div className="flex items-center justify-between border-b-2 border-ink bg-sun-100 px-5 py-3.5">
                <p className="text-sm font-extrabold">
                  {sheet === "toc" && "Daftar Isi Modul"}
                  {sheet === "modules" && `Semua Modul · ${track.short}`}
                  {sheet === "notes" && "Catatan Pribadi Modul"}
                </p>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-paper"
                  aria-label="Tutup"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-5">
                {sheet === "toc" && (
                  <ul className="space-y-1">
                    {toc.map((i) => (
                      <li key={i.id}>
                        <a
                          href={`#${i.id}`}
                          onClick={() => setSheet(null)}
                          className={`block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-sun-100 ${i.level === 3 ? "pl-7 text-muted" : "text-ink"}`}
                        >
                          {i.text}
                        </a>
                      </li>
                    ))}
                    <li>
                      <a href="#kuis" onClick={() => setSheet(null)} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink hover:bg-sun-100">
                        Kuis Singkat
                      </a>
                    </li>
                  </ul>
                )}

                {sheet === "modules" && (
                  <div onClick={() => setSheet(null)}>
                    <ModuleNav track={track} current={stageId} label="Daftar modul seluler" />
                  </div>
                )}

                {sheet === "notes" && (
                  <div>
                    <p className="text-xs leading-relaxed text-muted">
                      Tulis ringkasan dengan bahasamu sendiri — otomatis tersimpan di browser ini dan tampil di halaman Progres.
                    </p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(key, e.target.value)}
                      rows={8}
                      placeholder="Contoh: Poin penting yang baru kupahami hari ini..."
                      className="mt-3 w-full rounded-xl border-2 border-ink bg-cream p-3.5 text-base leading-relaxed outline-none focus:bg-paper sm:text-sm"
                    />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted">{note.length} karakter · tersimpan otomatis</span>
                      {note.trim() && (
                        <button type="button" onClick={downloadNote} className="btn btn-primary !px-3 !py-1.5 !text-xs">
                          <Download className="size-3.5" /> Unduh .md
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
