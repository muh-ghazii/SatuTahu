"use client";

import { useEffect, useState } from "react";
import { Bot, Bug, Compass, Flame, Puzzle, Sparkles } from "lucide-react";
import { useGamification } from "@/lib/gamification";
import { TahuBotGame } from "./TahuBotGame";
import { CodePuzzleGame } from "./CodePuzzleGame";
import { BugHunterGame } from "./BugHunterGame";
import { TechQuestGame } from "./TechQuestGame";

type Mode = "bot" | "puzzle" | "bug" | "quest";

const MODES: { id: Mode; title: string; sub: string; Icon: typeof Bot; badge: string }[] = [
  { id: "bot", title: "Tahu Bot", sub: "Logika grid & loop", Icon: Bot, badge: "6 Level" },
  { id: "puzzle", title: "Susun Kode", sub: "Rakit baris acak", Icon: Puzzle, badge: "8 Level" },
  { id: "bug", title: "Bug Hunter", sub: "Tebak output & bug", Icon: Bug, badge: "Arcade" },
  { id: "quest", title: "SQL/Git/CSS", sub: "Misi praktik live", Icon: Compass, badge: "10 Misi" },
];

export function GameArena() {
  const [mode, setMode] = useState<Mode>("bot");
  const { stats, levelInfo } = useGamification();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-6">
      {/* Mini HUD Gamifikasi */}
      {mounted && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-sun-100 px-4 py-3 shadow-hard-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold sm:text-sm">
            <span className="chip !bg-paper font-mono">Lv.{levelInfo.current.level} {levelInfo.current.title}</span>
            <span className="chip !bg-sun-300 font-mono"><Sparkles className="size-3.5" /> {stats.xp} XP</span>
            <span className="chip !bg-paper font-mono"><Flame className="size-3.5 text-[#e25822]" /> {stats.streak} hari</span>
          </div>
          <p className="text-xs font-semibold text-ink-2">
            Selesai: Bot {stats.botLevelsCleared.length}/6 · Puzzle {stats.puzzlesSolved.length}/8 · Quest {stats.questsSolved.length}/10
          </p>
        </div>
      )}

      {/* 4 Kartu Pemilih Mode Game (2x2 di HP, 4 kolom di Desktop) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {MODES.map(({ id, title, sub, Icon, badge }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`flex flex-col items-start rounded-2xl border-2 border-ink p-3.5 text-left transition-all sm:p-4 ${
                active ? "bg-sun-400 shadow-hard -translate-y-0.5" : "bg-paper hover:bg-sun-50 shadow-hard-sm"
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className={`grid size-9 place-items-center rounded-xl border-2 border-ink ${active ? "bg-ink text-sun-300" : "bg-cream text-ink"}`}>
                  <Icon className="size-5" />
                </span>
                <span className="rounded-md border border-ink/30 bg-paper px-1.5 py-0.5 font-mono text-[10px] font-bold">{badge}</span>
              </div>
              <p className="mt-3 text-sm font-extrabold sm:text-base">{title}</p>
              <p className="mt-0.5 text-xs text-ink-2">{sub}</p>
            </button>
          );
        })}
      </div>

      {/* Arena Game Aktif */}
      <div>
        {mode === "bot" && <TahuBotGame />}
        {mode === "puzzle" && <CodePuzzleGame />}
        {mode === "bug" && <BugHunterGame />}
        {mode === "quest" && <TechQuestGame />}
      </div>
    </div>
  );
}
