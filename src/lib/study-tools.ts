"use client";

import { useSyncExternalStore } from "react";

export type StudyPrefs = {
  fontSize: "sm" | "md" | "lg";
  focusMode: boolean;
};

export type StudyToolsState = {
  /** daftar "track/stage" yang di-bookmark */
  bookmarks: string[];
  /** catatan pribadi per "track/stage" */
  notes: Record<string, string>;
  prefs: StudyPrefs;
};

const KEY = "satutahu:study-tools:v1";
const EVENT = "satutahu:study-tools";

const DEFAULT_STATE: StudyToolsState = {
  bookmarks: [],
  notes: {},
  prefs: { fontSize: "md", focusMode: false },
};

let cache: StudyToolsState | null = null;
let cacheRaw: string | null = null;

function read(): StudyToolsState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cacheRaw && cache) return cache;
    cacheRaw = raw;
    if (!raw) {
      cache = DEFAULT_STATE;
      return cache;
    }
    const parsed = JSON.parse(raw) as Partial<StudyToolsState>;
    cache = {
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      prefs: { ...DEFAULT_STATE.prefs, ...(parsed.prefs ?? {}) },
    };
    return cache;
  } catch {
    return DEFAULT_STATE;
  }
}

function write(next: StudyToolsState) {
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

export function moduleKey(track: string, stage: string) {
  return `${track}/${stage}`;
}

export function useStudyTools() {
  const state = useSyncExternalStore(subscribe, read, () => DEFAULT_STATE);

  const toggleBookmark = (key: string) => {
    const cur = read();
    const exists = cur.bookmarks.includes(key);
    const bookmarks = exists ? cur.bookmarks.filter((b) => b !== key) : [key, ...cur.bookmarks];
    write({ ...cur, bookmarks });
  };

  const setNote = (key: string, text: string) => {
    const cur = read();
    const notes = { ...cur.notes };
    if (text.trim().length === 0) delete notes[key];
    else notes[key] = text;
    write({ ...cur, notes });
  };

  const setPrefs = (patch: Partial<StudyPrefs>) => {
    const cur = read();
    write({ ...cur, prefs: { ...cur.prefs, ...patch } });
  };

  return { state, toggleBookmark, setNote, setPrefs };
}
