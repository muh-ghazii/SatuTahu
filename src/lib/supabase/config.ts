/** Kunci publik Supabase (aman berada di browser; perlindungan data memakai Row Level Security). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Situs tetap berjalan normal tanpa Supabase; fitur akun hanya aktif bila env sudah diisi. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
