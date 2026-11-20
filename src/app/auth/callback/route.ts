import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeNext } from "@/lib/safe-redirect";

/**
 * Tujuan kembali setelah login Google, konfirmasi email, dan reset password.
 * Menukar kode sekali pakai menjadi sesi, lalu menyimpannya di cookie.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  // Di belakang proxy hosting (Netlify), gunakan host asli dari header.
  const fwdHost = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = fwdHost && process.env.NODE_ENV !== "development" ? `${fwdProto}://${fwdHost}` : url.origin;

  const providerError = url.searchParams.get("error_description");
  if (providerError) return NextResponse.redirect(`${base}/masuk?error=${encodeURIComponent(providerError)}`);

  const supabase = await createSupabaseServer();
  let error: unknown = null;
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  else error = { message: "Tautan tidak lengkap atau sudah kedaluwarsa." };

  if (!error) return NextResponse.redirect(`${base}${next}`);
  const msg = authErrorMessage(error);
  const hint = " Jika kamu membuka tautan dari browser/perangkat lain, coba masuk ulang dari browser tempat kamu mendaftar.";
  return NextResponse.redirect(`${base}/masuk?error=${encodeURIComponent(msg + hint)}`);
}
