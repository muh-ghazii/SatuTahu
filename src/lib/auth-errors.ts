export const MIN_PASSWORD = 8;

/** Terjemahkan pesan error Supabase ke Bahasa Indonesia yang jelas. */
export function authErrorMessage(err: unknown): string {
  const e = err as { message?: string; code?: string; status?: number } | null;
  const code = e?.code ?? "";
  const msg = (e?.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "Email atau password salah.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return "Email belum dikonfirmasi. Buka tautan konfirmasi yang kami kirim ke emailmu.";
  if (code === "user_already_exists" || msg.includes("already registered")) return "Email ini sudah terdaftar. Silakan masuk atau gunakan ‘Lupa password’.";
  if (code === "weak_password" || msg.includes("password should")) return `Password terlalu lemah. Gunakan minimal ${MIN_PASSWORD} karakter dan hindari password umum.`;
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || e?.status === 429) return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
  if (code === "same_password") return "Password baru harus berbeda dari password lama.";
  if (code === "validation_failed" || msg.includes("invalid email")) return "Format email tidak valid.";
  if (msg.includes("failed to fetch") || msg.includes("network")) return "Tidak dapat terhubung ke server. Periksa koneksi internetmu.";
  if (msg.includes("provider is not enabled")) return "Login Google belum diaktifkan di pengaturan Supabase.";
  return e?.message || "Terjadi kesalahan. Coba lagi.";
}

