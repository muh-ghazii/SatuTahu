/** Hanya izinkan path relatif di situs ini (mencegah open redirect ke domain lain). */
export function safeNext(next: string | null | undefined, fallback = "/progres"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
