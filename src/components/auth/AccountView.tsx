"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { KeyRound, Loader2, LogOut, RefreshCw } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { useAuth, displayName } from "./AuthProvider";
import { Notice } from "./AuthForms";
import { SyncStatusText } from "./SyncBadge";
import { UserAvatar } from "./UserAvatar";

export function AccountView() {
  const { configured, user, loading, signOut, syncNow } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false); // keluar sengaja: jangan arahkan ke halaman masuk

  useEffect(() => {
    if (configured && !loading && !user && !leavingRef.current) router.replace("/masuk?next=/akun");
  }, [configured, loading, user, router]);
  useEffect(() => {
    if (user) setName(displayName(user));
  }, [user]);

  if (!configured) {
    return <div className="mt-6 max-w-xl"><Notice kind="info">Fitur akun belum dikonfigurasi di instalasi ini.</Notice></div>;
  }
  if (loading || !user) {
    return <div className="card mt-6 h-64 max-w-2xl animate-pulse" aria-busy="true" />;
  }

  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [user.app_metadata?.provider ?? "email"];
  const hasPassword = providers.includes("email");

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setSaving(true);
    setMsg(null);
    const { error } = await sb.auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    setMsg(error ? { kind: "error", text: authErrorMessage(error) } : { kind: "success", text: "Nama berhasil disimpan." });
  };

  const onSignOut = async () => {
    leavingRef.current = true;
    setLeaving(true);
    await signOut();
    router.replace("/");
  };

  return (
    <div className="mt-6 grid max-w-4xl gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="card p-6">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size={64} />
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-extrabold tracking-tight">{displayName(user)}</h2>
            <p className="truncate text-muted">{user.email}</p>
            <p className="mt-1 text-xs font-bold tracking-[0.1em] text-muted uppercase">
              Masuk dengan {providers.map((p) => (p === "google" ? "Google" : "Email")).join(" & ")}
            </p>
          </div>
        </div>
        <form onSubmit={saveName} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-bold">Nama tampilan</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="mt-1.5 w-full rounded-xl border-2 border-ink bg-paper px-3.5 py-2.5 outline-none focus:shadow-hard-sm" />
          </label>
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <button type="submit" disabled={saving} className="btn btn-primary !py-2.5">
            {saving && <Loader2 className="size-4 animate-spin" />} Simpan
          </button>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">Sinkron progres</p>
          <p className="mt-2 text-sm font-semibold"><SyncStatusText /></p>
          <p className="mt-2 text-sm text-muted">Centang topik otomatis tersimpan ke akunmu dan tersedia di perangkat lain setelah masuk.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={syncNow} className="btn btn-ghost !py-2 text-sm"><RefreshCw className="size-4" /> Sinkron sekarang</button>
            <Link href="/progres" className="btn btn-ghost !py-2 text-sm">Lihat progres</Link>
          </div>
        </div>
        <div className="card space-y-2 p-5">
          {hasPassword && (
            <Link href="/akun/ubah-password" className="btn btn-ghost w-full !justify-start !py-2.5"><KeyRound className="size-4" /> Ubah password</Link>
          )}
          <button onClick={onSignOut} disabled={leaving} className="btn btn-ghost w-full !justify-start !py-2.5">
            {leaving ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} Keluar
          </button>
          <p className="pt-1 text-xs leading-relaxed text-muted">Saat keluar, progres disimpan ke akun lalu dihapus dari browser ini, sehingga aman di komputer bersama.</p>
        </div>
      </aside>
    </div>
  );
}
