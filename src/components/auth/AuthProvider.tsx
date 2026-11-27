"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readProgress, replaceProgress, subscribeProgress, type ProgressState } from "@/lib/progress";
import { mergeProgress, sameProgress, sanitizeProgress } from "@/lib/progress-merge";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

type AuthContextValue = {
  configured: boolean;
  user: User | null;
  loading: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  syncNow: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const baseKey = (uid: string) => `satutahu:progress:base:${uid}`;

function loadBase(uid: string): ProgressState {
  try {
    return sanitizeProgress(JSON.parse(window.localStorage.getItem(baseKey(uid)) ?? "{}"));
  } catch {
    return {};
  }
}
function saveBase(uid: string, state: ProgressState) {
  try {
    window.localStorage.setItem(baseKey(uid), JSON.stringify(state));
  } catch {
    /* abaikan */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const uidRef = useRef<string | null>(null);
  const exchangedCodeRef = useRef<string | null>(null);
  const syncing = useRef(false);
  const pending = useRef(false);
  const applying = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncOnce = useCallback(async () => {
    const sb = getSupabase();
    const uid = uidRef.current;
    if (!sb || !uid) return;
    if (syncing.current) {
      pending.current = true;
      return;
    }
    syncing.current = true;
    setSyncStatus("syncing");
    try {
      const { data, error } = await sb.from("progress").select("data").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      if (uidRef.current !== uid) return; // pengguna berganti di tengah proses
      const remote = sanitizeProgress(data?.data);
      const local = readProgress();
      const merged = mergeProgress(loadBase(uid), local, remote);
      if (!data || !sameProgress(merged, remote)) {
        const { error: upErr } = await sb.from("progress").upsert({ user_id: uid, data: merged });
        if (upErr) throw upErr;
      }
      if (!sameProgress(merged, local)) {
        applying.current = true;
        replaceProgress(merged);
        applying.current = false;
      }
      saveBase(uid, merged);
      setSyncStatus("synced");
      setLastSyncedAt(new Date());
    } catch (e) {
      console.warn("[SatuTahu] Gagal sinkron progres:", e);
      setSyncStatus("error");
    } finally {
      syncing.current = false;
      if (pending.current) {
        pending.current = false;
        void syncOnce();
      }
    }
  }, []);

  const schedule = useCallback(() => {
    if (!uidRef.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void syncOnce(), 900);
  }, [syncOnce]);

  // Status login + fallback penukaran ?code=... jika Supabase mengarahkan ke Site URL (/) alih-alih /auth/callback
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;

    const applySession = (next: User | null) => {
      if (!alive) return;
      const changed = next?.id !== uidRef.current;
      uidRef.current = next?.id ?? null;
      setUser(next);
      setLoading(false);
      if (next && changed) void syncOnce();
      if (!next) setSyncStatus("idle");
    };

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    void (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code && !url.pathname.startsWith("/auth/") && exchangedCodeRef.current !== code) {
          exchangedCodeRef.current = code;
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.pathname + url.search + url.hash);
          const { data, error } = await sb.auth.exchangeCodeForSession(code);
          if (!error && data.session?.user) {
            applySession(data.session.user);
            return;
          }
          if (error) console.warn("[SatuTahu] Gagal menukar kode login:", error);
        }
        const { data } = await sb.auth.getSession();
        applySession(data.session?.user ?? null);
      } catch (e) {
        console.warn("[SatuTahu] Gagal memuat sesi:", e);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [syncOnce]);

  // Perubahan progres lokal → sinkron (debounce); kembali ke tab / online → tarik perubahan perangkat lain
  useEffect(() => {
    const unsub = subscribeProgress(() => {
      if (!applying.current) schedule();
    });
    const onVisible = () => document.visibilityState === "visible" && schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", schedule);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", schedule);
    };
  }, [schedule]);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    if (timer.current) clearTimeout(timer.current);
    await syncOnce(); // pastikan perubahan terakhir tersimpan sebelum keluar
    const uid = uidRef.current;
    await sb.auth.signOut();
    // Progres sudah tersimpan di akun; bersihkan dari perangkat ini (aman untuk komputer bersama).
    if (uid) {
      try {
        window.localStorage.removeItem(baseKey(uid));
      } catch {
        /* abaikan */
      }
    }
    applying.current = true;
    replaceProgress({});
    applying.current = false;
  }, [syncOnce]);

  const value = useMemo<AuthContextValue>(
    () => ({ configured: isSupabaseConfigured, user, loading, syncStatus, lastSyncedAt, syncNow: () => void syncOnce(), signOut }),
    [user, loading, syncStatus, lastSyncedAt, syncOnce, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}

/** Nama tampilan dari metadata (Google memberi full_name/name; pendaftaran email menyimpan full_name). */
export function displayName(user: User): string {
  const m = user.user_metadata ?? {};
  return (m.full_name || m.name || user.email?.split("@")[0] || "Pengguna") as string;
}
export function avatarUrl(user: User): string | null {
  const m = user.user_metadata ?? {};
  return (m.avatar_url || m.picture || null) as string | null;
}
