"use client";

import { useSyncExternalStore } from "react";
import { recordStudyAction } from "./gamification";

/** Progres disimpan per jalur: daftar id topik "stageId:index" yang sudah dicentang */
export type ProgressState = Record<string, string[]>;

const KEY = "satutahu:progress:v1";
const EVENT = "satutahu:progress";
const EMPTY: ProgressState = {};

let cache: ProgressState | null = null;
let cacheRaw: string | null = null;

function read(): ProgressState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cacheRaw && cache) return cache;
    cacheRaw = raw;
    cache = raw ? (JSON.parse(raw) as ProgressState) : EMPTY;
    return cache;
  } catch {
    return EMPTY;
  }
}

function write(next: ProgressState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage penuh / diblokir: abaikan, progres tetap di memori sesi */
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

/* --- API untuk sinkronisasi akun (dipakai ProgressSync) --- */
export function readProgress(): ProgressState {
  return read();
}
export function replaceProgress(next: ProgressState) {
  write(next);
}
export function subscribeProgress(cb: () => void) {
  return subscribe(cb);
}

export function useProgress() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = (track: string, id: string) => {
    const cur = read();
    const list = new Set(cur[track] ?? []);
    const adding = !list.has(id);
    if (adding) list.add(id);
    else list.delete(id);
    write({ ...cur, [track]: [...list] });
    if (adding) {
      recordStudyAction((s) => ({ topicsCheckedTotal: s.topicsCheckedTotal + 1 }), 15);
    }
  };

  const setMany = (track: string, ids: string[], done: boolean) => {
    const cur = read();
    const list = new Set(cur[track] ?? []);
    let added = 0;
    ids.forEach((id) => {
      if (done) {
        if (!list.has(id)) added++;
        list.add(id);
      } else {
        list.delete(id);
      }
    });
    write({ ...cur, [track]: [...list] });
    if (added > 0) {
      recordStudyAction((s) => ({ topicsCheckedTotal: s.topicsCheckedTotal + added }), added * 15);
    }
  };

  const reset = (track?: string) => {
    if (!track) return write({});
    const cur = { ...read() };
    delete cur[track];
    write(cur);
  };

  return { state, toggle, setMany, reset };
}

export function topicId(stageId: string, index: number) {
  return `${stageId}:${index}`;
}
