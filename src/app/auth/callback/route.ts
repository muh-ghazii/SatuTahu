import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeNext } from "@/lib/safe-redirect";

/**
 * Tujuan kembali setelah login Google, konfirmasi email, dan reset password.
 * Menukar kode sekali pakai menjadi sesi, lalu menempelkan cookie sesi langsung ke response redirect
 * agar 100% terbawa di belakang proxy hosting (Netlify/OpenNext/Vercel).
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

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        pendingCookies.push(...list);
      },
    },
  });

  let error: unknown = null;
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  else error = { message: "Tautan tidak lengkap atau sudah kedaluwarsa." };

  if (!error) {
    const res = NextResponse.redirect(`${base}${next}`);
    for (const { name, value, options } of pendingCookies) {
      res.cookies.set(name, value, options);
    }
    return res;
  }

  const msg = authErrorMessage(error);
  const hint = " Jika kamu membuka tautan dari browser/perangkat lain, coba masuk ulang dari browser tempat kamu mendaftar.";
  return NextResponse.redirect(`${base}/masuk?error=${encodeURIComponent(msg + hint)}`);
}
