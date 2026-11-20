"use client";

import Link from "next/link";
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useAuth, type SyncStatus } from "./AuthProvider";

const label: Record<SyncStatus, string> = {
  idle: "Belum disinkronkan",
  syncing: "Menyinkronkan…",
  synced: "Tersimpan di akun",
  error: "Gagal sinkron, akan dicoba lagi",
};

export function SyncStatusText() {
  const { syncStatus, lastSyncedAt } = useAuth();
  const Icon = syncStatus === "syncing" ? Loader2 : syncStatus === "error" ? CloudOff : Cloud;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className={`size-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
      {label[syncStatus]}
      {syncStatus === "synced" && lastSyncedAt && (
        <span className="text-muted">· {lastSyncedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
      )}
    </span>
  );
}

/** Banner di halaman progres: ajak masuk, atau tampilkan status sinkron. */
export function ProgressSyncBanner() {
  const { configured, user, loading, syncNow } = useAuth();
  if (!configured || loading) return null;
  if (!user) {
    return (
      <div className="card mt-8 flex flex-col gap-4 !bg-sun-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-extrabold">Progresmu saat ini hanya tersimpan di browser ini.</p>
          <p className="mt-1 text-sm text-muted">Masuk atau daftar gratis agar progres tersimpan di akun dan bisa dilanjutkan di HP atau laptop lain. Centang yang sudah ada akan ikut dipindahkan.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/masuk?next=/progres" className="btn btn-ghost !py-2">Masuk</Link>
          <Link href="/daftar?next=/progres" className="btn btn-primary !py-2">Daftar</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold">
      <SyncStatusText />
      <button onClick={syncNow} className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-paper px-2.5 py-1 text-xs font-bold hover:bg-sun-100">
        <RefreshCw className="size-3.5" /> Sinkron sekarang
      </button>
    </div>
  );
}
