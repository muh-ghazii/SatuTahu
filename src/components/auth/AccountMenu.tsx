"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarChart3, LogOut, UserRound } from "lucide-react";
import { useAuth, displayName } from "./AuthProvider";
import { SyncStatusText } from "./SyncBadge";
import { UserAvatar } from "./UserAvatar";

/** Tombol ‘Masuk’ atau avatar + menu akun di navbar (desktop). */
export function AccountMenu() {
  const { configured, user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!configured) return null;
  if (loading) return <span className="hidden size-10 animate-pulse rounded-full bg-ink/10 md:block" aria-hidden />;
  if (!user) {
    return (
      <Link href="/masuk" className="btn btn-ghost hidden !py-2 md:inline-flex">
        Masuk
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      <button onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Menu akun" className="rounded-full transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-sun-400 focus-visible:outline-none">
        <UserAvatar user={user} size={40} />
      </button>
      {open && (
        <div role="menu" className="card absolute top-12 right-0 z-50 w-64 overflow-hidden !p-0">
          <div className="border-b-2 border-ink/10 px-4 py-3">
            <p className="truncate font-extrabold">{displayName(user)}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
            <p className="mt-2 text-xs font-semibold"><SyncStatusText /></p>
          </div>
          <div className="p-1.5">
            <Link role="menuitem" href="/akun" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-sun-100"><UserRound className="size-4" /> Akun saya</Link>
            <Link role="menuitem" href="/progres" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-sun-100"><BarChart3 className="size-4" /> Progres saya</Link>
            <button
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.replace("/");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-sun-100"
            >
              <LogOut className="size-4" /> Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Bagian akun di menu mobile. */
export function MobileAccountLinks() {
  const { configured, user, loading, signOut } = useAuth();
  const router = useRouter();
  if (!configured || loading) return null;
  if (!user) {
    return (
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Link href="/masuk" className="btn btn-ghost">Masuk</Link>
        <Link href="/daftar" className="btn btn-dark">Daftar</Link>
      </div>
    );
  }
  return (
    <div className="mt-2 rounded-xl border-2 border-ink bg-paper p-3">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size={40} />
        <div className="min-w-0">
          <p className="truncate font-extrabold">{displayName(user)}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/akun" className="btn btn-ghost !py-2 text-sm">Akun saya</Link>
        <button onClick={async () => { await signOut(); router.replace("/"); }} className="btn btn-ghost !py-2 text-sm">Keluar</button>
      </div>
    </div>
  );
}
