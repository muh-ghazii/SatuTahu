import type { ProgressState } from "./progress";

/**
 * Penggabungan tiga arah (three-way merge) untuk progres.
 *
 * - `base`   : keadaan terakhir yang kita ketahui sama di perangkat ini dan di server.
 * - `local`  : keadaan sekarang di perangkat ini.
 * - `remote` : keadaan sekarang di server (bisa sudah diubah perangkat lain).
 *
 * Perubahan lokal sejak `base` (topik dicentang / dihapus centangnya) diterapkan di atas `remote`.
 * Dengan begitu, centang dari HP tidak menimpa centang dari laptop, dan menghapus centang
 * juga ikut tersinkron — tidak muncul kembali.
 */
export function mergeProgress(base: ProgressState, local: ProgressState, remote: ProgressState): ProgressState {
  const tracks = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
  const out: ProgressState = {};
  for (const t of tracks) {
    const b = new Set(base[t] ?? []);
    const l = new Set(local[t] ?? []);
    const result = new Set(remote[t] ?? []);
    for (const id of l) if (!b.has(id)) result.add(id); // dicentang di perangkat ini
    for (const id of b) if (!l.has(id)) result.delete(id); // centangnya dihapus di perangkat ini
    if (result.size) out[t] = [...result].sort();
  }
  return out;
}

/** Bandingkan dua state tanpa peduli urutan. */
export function sameProgress(a: ProgressState, b: ProgressState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k] ?? [];
    const y = b[k] ?? [];
    if (x.length !== y.length) return false;
    const sy = new Set(y);
    if (!x.every((v) => sy.has(v))) return false;
  }
  return true;
}

/** Validasi bentuk data dari server sebelum dipakai. */
export function sanitizeProgress(data: unknown): ProgressState {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: ProgressState = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (typeof k === "string" && k.length <= 64 && Array.isArray(v)) {
      const ids = v.filter((x): x is string => typeof x === "string" && x.length <= 64);
      if (ids.length) out[k] = ids;
    }
  }
  return out;
}
