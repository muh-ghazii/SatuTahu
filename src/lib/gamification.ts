"use client";

import { useSyncExternalStore } from "react";

export type GameStats = {
  xp: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD lokal
  quizzesCompleted: number;
  perfectQuizzes: number;
  topicsCheckedTotal: number;
  playgroundRuns: number;
  challengesSolved: number;
  gamesPlayed: number;
  botLevelsCleared: number[];
  puzzlesSolved: number[];
  questsSolved: number[];
  bugHunterBest: number;
  flashcardsReviewed: number;
};

export type BadgeDef = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (s: GameStats) => boolean;
};

export const LEVELS = [
  { level: 1, title: "Tahu Mentah", minXp: 0 },
  { level: 2, title: "Tahu Hangat", minXp: 150 },
  { level: 3, title: "Tahu Krispi", minXp: 400 },
  { level: 4, title: "Tahu Isi", minXp: 800 },
  { level: 5, title: "Tahu Gejrot", minXp: 1400 },
  { level: 6, title: "Master Tahu", minXp: 2300 },
  { level: 7, title: "Suhu Teknologi", minXp: 3600 },
] as const;

export const BADGES: BadgeDef[] = [
  { id: "first-step", name: "Langkah Pertama", desc: "Mulai belajar & raih 30 XP pertamamu.", icon: "🌱", check: (s) => s.xp >= 30 },
  { id: "topic-10", name: "Pembelajar Tekun", desc: "Centang minimal 10 topik materi.", icon: "📚", check: (s) => s.topicsCheckedTotal >= 10 },
  { id: "quiz-ace", name: "Penakluk Kuis", desc: "Selesaikan kuis modul dengan skor 100%.", icon: "🎯", check: (s) => s.perfectQuizzes >= 1 },
  { id: "streak-3", name: "Konsisten 3 Hari", desc: "Belajar atau main 3 hari berturut-turut.", icon: "🔥", check: (s) => s.bestStreak >= 3 },
  { id: "streak-7", name: "Seminggu Tanpa Putus", desc: "Pertahankan streak belajar 7 hari.", icon: "⚡", check: (s) => s.bestStreak >= 7 },
  { id: "coder-lab", name: "Eksperimen Lab", desc: "Jalankan kode di Coding Playground 5 kali.", icon: "🧪", check: (s) => s.playgroundRuns >= 5 },
  { id: "challenge-3", name: "Pemecah Tantangan", desc: "Selesaikan 3 tantangan di Playground.", icon: "🛠️", check: (s) => s.challengesSolved >= 3 },
  { id: "bot-master", name: "Komandan Tahu Bot", desc: "Tuntaskan 4 level game Tahu Bot.", icon: "🤖", check: (s) => s.botLevelsCleared.length >= 4 },
  { id: "puzzle-pro", name: "Perakit Kode", desc: "Selesaikan 4 level Susun Kode.", icon: "🧩", check: (s) => s.puzzlesSolved.length >= 4 },
  { id: "bug-hunter", name: "Pemburu Bug", desc: "Raih skor ≥ 500 di Bug Hunter & Tebak Output.", icon: "🐛", check: (s) => s.bugHunterBest >= 500 },
  { id: "quest-hero", name: "Penjelajah Quest", desc: "Selesaikan 4 misi SQL / Git / CSS Quest.", icon: "🗺️", check: (s) => s.questsSolved.length >= 4 },
  { id: "flash-20", name: "Ingatan Tajam", desc: "Ulas 20 flashcard konsep.", icon: "💡", check: (s) => s.flashcardsReviewed >= 20 },
];

const KEY = "satutahu:gamification:v1";
const EVENT = "satutahu:gamification";

const DEFAULT_STATS: GameStats = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  quizzesCompleted: 0,
  perfectQuizzes: 0,
  topicsCheckedTotal: 0,
  playgroundRuns: 0,
  challengesSolved: 0,
  gamesPlayed: 0,
  botLevelsCleared: [],
  puzzlesSolved: [],
  questsSolved: [],
  bugHunterBest: 0,
  flashcardsReviewed: 0,
};

let cache: GameStats | null = null;
let cacheRaw: string | null = null;

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function read(): GameStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cacheRaw && cache) return cache;
    cacheRaw = raw;
    cache = raw ? { ...DEFAULT_STATS, ...(JSON.parse(raw) as Partial<GameStats>) } : DEFAULT_STATS;
    return cache;
  } catch {
    return DEFAULT_STATS;
  }
}

function write(next: GameStats) {
  if (typeof window === "undefined") return;
  try {
    const str = JSON.stringify(next);
    window.localStorage.setItem(KEY, str);
    cacheRaw = str;
    cache = next;
  } catch {
    cache = next;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

function touchStreak(s: GameStats): GameStats {
  const today = todayKey();
  if (s.lastActiveDate === today) return s;
  const nextStreak = s.lastActiveDate === yesterdayKey() ? s.streak + 1 : 1;
  return {
    ...s,
    streak: nextStreak,
    bestStreak: Math.max(s.bestStreak, nextStreak),
    lastActiveDate: today,
  };
}

export function recordStudyAction(updater: (cur: GameStats) => Partial<GameStats>, xpDelta = 0) {
  const cur = touchStreak(read());
  const patch = updater(cur);
  write({
    ...cur,
    ...patch,
    xp: Math.max(0, (patch.xp ?? cur.xp) + xpDelta),
  });
}

export function getLevelInfo(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const span = next ? next.minXp - current.minXp : 1;
  const pct = next ? Math.min(1, (xp - current.minXp) / span) : 1;
  return { current, next, pct, remaining: next ? Math.max(0, next.minXp - xp) : 0 };
}

export function useGamification() {
  const stats = useSyncExternalStore(subscribe, read, () => DEFAULT_STATS);
  const levelInfo = getLevelInfo(stats.xp);
  const unlockedBadges = BADGES.filter((b) => b.check(stats));
  return { stats, levelInfo, unlockedBadges, allBadges: BADGES };
}
