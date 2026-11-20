"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { safeNext } from "@/lib/safe-redirect";
import { MIN_PASSWORD, authErrorMessage } from "@/lib/auth-errors";
import { useAuth } from "./AuthProvider";

/* ---------- utilitas ---------- */

function origin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

/* ---------- komponen UI ---------- */

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="card w-full max-w-md min-w-0 p-6 [overflow-wrap:anywhere] sm:p-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 border-t-2 border-ink/10 pt-5 text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}

export function Notice({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  const style =
    kind === "error" ? "border-[#d9534f] bg-[#fdecea] text-[#7a1f1c]" : kind === "success" ? "border-[#2fb36b] bg-[#e8f7ee] text-[#155c35]" : "border-ink bg-sun-100 text-ink";
  const Icon = kind === "error" ? AlertCircle : kind === "success" ? CheckCircle2 : Mail;
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`flex gap-2.5 rounded-xl border-2 px-3.5 py-3 text-sm leading-relaxed ${style}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border-2 border-ink bg-paper px-3.5 py-2.5 text-[15px] outline-none transition-shadow placeholder:text-muted/70 focus:shadow-hard-sm focus-visible:ring-2 focus-visible:ring-sun-400";

function PasswordInput({ value, onChange, autoComplete, name = "password" }: { value: string; onChange: (v: string) => void; autoComplete: string; name?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        required
        minLength={autoComplete === "new-password" ? MIN_PASSWORD : undefined}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-1 my-auto grid size-9 place-items-center rounded-lg text-muted hover:bg-sun-100 hover:text-ink"
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3 disabled:cursor-wait disabled:opacity-70">
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function GoogleButton({ next, label = "Lanjutkan dengan Google" }: { next: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onClick = async () => {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setError(authErrorMessage(error));
      setBusy(false);
    }
    // sukses: browser diarahkan ke halaman Google
  };
  return (
    <div className="space-y-3">
      <button type="button" onClick={onClick} disabled={busy} className="btn btn-ghost w-full !py-3 disabled:opacity-70">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />} {label}
      </button>
      {error && <Notice kind="error">{error}</Notice>}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs font-bold tracking-[0.12em] text-muted uppercase">
      <span className="h-0.5 flex-1 bg-ink/10" /> atau dengan email <span className="h-0.5 flex-1 bg-ink/10" />
    </div>
  );
}

function NotConfigured() {
  return (
    <Notice kind="info">
      Fitur akun belum aktif di instalasi ini. Admin perlu mengisi <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
      <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (lihat <code className="font-mono">docs/SETUP.md</code>). Tanpa akun pun kamu tetap bisa belajar;
      progres tersimpan di browser ini.
    </Notice>
  );
}

/** Jika sudah login, arahkan pergi dari halaman masuk/daftar. */
function useRedirectIfSignedIn(next: string) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [user, loading, next, router]);
}

/* ---------- formulir ---------- */

export function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const callbackError = params.get("error");
  const router = useRouter();
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useRedirectIfSignedIn(next);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(authErrorMessage(error));
      setBusy(false);
      return;
    }
    router.replace(next);
  };

  return (
    <AuthCard
      title="Masuk"
      subtitle="Lanjutkan belajar dan sinkronkan progresmu di semua perangkat."
      footer={<>Belum punya akun? <Link href={`/daftar${next !== "/progres" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-ink underline">Daftar gratis</Link></>}
    >
      {!configured ? (
        <NotConfigured />
      ) : (
        <>
          {callbackError && <div className="mb-4"><Notice kind="error">{callbackError}</Notice></div>}
          <GoogleButton next={next} label="Masuk dengan Google" />
          <Divider />
          <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
            <Field label="Email">
              <input type="email" name="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="nama@email.com" />
            </Field>
            <Field label="Password">
              <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
            </Field>
            <div className="-mt-1 text-right">
              <Link href="/lupa-password" className="text-sm font-semibold text-ink-2 underline-offset-2 hover:underline">Lupa password?</Link>
            </div>
            {error && <Notice kind="error">{error}</Notice>}
            <SubmitButton busy={busy}>Masuk <ArrowRight className="size-4" /></SubmitButton>
          </form>
        </>
      )}
    </AuthCard>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const router = useRouter();
  const { configured } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  useRedirectIfSignedIn(next);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(`Password minimal ${MIN_PASSWORD} karakter.`);
    if (password !== confirm) return setError("Konfirmasi password tidak sama.");
    setBusy(true);
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    // Supabase tidak membocorkan apakah email sudah terdaftar: identities kosong = email sudah dipakai.
    if (data.user && data.user.identities?.length === 0) return setError(authErrorMessage({ code: "user_already_exists" }));
    if (data.session) router.replace(next);
    else setSentTo(email.trim());
  };

  if (sentTo) {
    return (
      <AuthCard title="Cek emailmu" subtitle="Satu langkah lagi untuk mengaktifkan akun.">
        <Notice kind="success">
          Kami mengirim tautan konfirmasi ke <b>{sentTo}</b>. Buka tautan itu dari browser ini untuk menyelesaikan pendaftaran. Tidak ada di kotak masuk? Periksa folder Spam/Promosi.
        </Notice>
        <Link href="/masuk" className="btn btn-ghost mt-5 w-full">Kembali ke halaman masuk</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Buat akun"
      subtitle="Gratis. Progres belajarmu tersimpan di akun dan bisa dilanjutkan di HP atau laptop lain."
      footer={<>Sudah punya akun? <Link href="/masuk" className="font-bold text-ink underline">Masuk</Link></>}
    >
      {!configured ? (
        <NotConfigured />
      ) : (
        <>
          <GoogleButton next={next} label="Daftar dengan Google" />
          <Divider />
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Nama">
              <input type="text" name="name" required autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nama lengkap" />
            </Field>
            <Field label="Email">
              <input type="email" name="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="nama@email.com" />
            </Field>
            <Field label="Password" hint={`Minimal ${MIN_PASSWORD} karakter. Kalimat pendek lebih kuat daripada kata acak yang pendek.`}>
              <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
            </Field>
            <Field label="Ulangi password">
              <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" name="confirm" />
            </Field>
            {error && <Notice kind="error">{error}</Notice>}
            <SubmitButton busy={busy}>Daftar <ArrowRight className="size-4" /></SubmitButton>
            <p className="text-center text-xs leading-relaxed text-muted">
              Kami hanya menyimpan nama, email, dan progres belajarmu. Data tidak dijual atau dibagikan.
            </p>
          </form>
        </>
      )}
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin()}/auth/callback?next=${encodeURIComponent("/akun/ubah-password")}`,
    });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    setSent(true);
  };

  return (
    <AuthCard
      title="Lupa password"
      subtitle="Masukkan email akunmu. Kami akan mengirim tautan untuk membuat password baru."
      footer={<Link href="/masuk" className="font-bold text-ink underline">Kembali ke halaman masuk</Link>}
    >
      {!configured ? (
        <NotConfigured />
      ) : sent ? (
        <Notice kind="success">
          Jika <b>{email}</b> terdaftar, tautan reset sudah dikirim. Buka dari browser ini. Akun yang dibuat dengan Google tidak memakai password; cukup pilih ‘Masuk dengan Google’.
        </Notice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <input type="email" name="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="nama@email.com" />
          </Field>
          {error && <Notice kind="error">{error}</Notice>}
          <SubmitButton busy={busy}>Kirim tautan reset</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}

export function UpdatePasswordForm() {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (configured && !loading && !user) router.replace("/masuk?next=/akun/ubah-password");
  }, [configured, loading, user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(`Password minimal ${MIN_PASSWORD} karakter.`);
    if (password !== confirm) return setError("Konfirmasi password tidak sama.");
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    setDone(true);
  };

  return (
    <AuthCard title="Buat password baru" subtitle={user?.email ? <>Untuk akun <b className="text-ink">{user.email}</b></> : undefined}>
      {!configured ? (
        <NotConfigured />
      ) : done ? (
        <>
          <Notice kind="success">Password berhasil diperbarui.</Notice>
          <Link href="/akun" className="btn btn-primary mt-5 w-full">Ke halaman akun</Link>
        </>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Password baru" hint={`Minimal ${MIN_PASSWORD} karakter.`}>
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
          </Field>
          <Field label="Ulangi password baru">
            <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" name="confirm" />
          </Field>
          {error && <Notice kind="error">{error}</Notice>}
          <SubmitButton busy={busy || loading}>Simpan password</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
