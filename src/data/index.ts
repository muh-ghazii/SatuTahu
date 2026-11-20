import reposJson from "./repos.json";
import { softwareTracks } from "./tracks-software";
import { dataTracks } from "./tracks-data";
import { infraTracks, foundations } from "./tracks-infra";
import { extraTracks } from "./tracks-extra";
import type { Category, Resource, Track } from "./types";

export type { Track, Resource, Stage, Category, ResourceKind } from "./types";
export { foundations };

type RepoMeta = { stars: number; desc: string };
const repos = reposJson as Record<string, RepoMeta>;

/** Tanggal snapshot metadata GitHub (jalankan `npm run sync:github` untuk memperbarui) */
export const SNAPSHOT_DATE = "20 November 2026";

const byCat = (c: Category) => extraTracks.filter((t) => t.category === c);
export const tracks: Track[] = [
  ...byCat("fondasi"),
  ...softwareTracks,
  ...byCat("software"),
  ...dataTracks,
  ...infraTracks,
  ...byCat("infra"),
];

export const categories: { id: Category; label: string; desc: string }[] = [
  { id: "fondasi", label: "Fondasi IT", desc: "Dasar pemrograman & ilmu komputer untuk semua jalur" },
  { id: "software", label: "Software Development", desc: "Web, mobile, backend, desain, testing, dan game" },
  { id: "data", label: "Data & AI", desc: "Analisis, rekayasa data, ML, DL, CV, dan LLM" },
  { id: "infra", label: "Infrastruktur & Keamanan", desc: "Jaringan, DevOps & cloud, keamanan siber, dan IoT" },
];

export function getTrack(slug: string) {
  return tracks.find((t) => t.slug === slug);
}

function cleanDesc(desc: string) {
  return desc
    .replace(/\s*Contribute to [^ ]+ development by creating an account on GitHub\.?/i, "")
    .replace(/\s*-\s*GitHub\s*-\s*.*$/i, "")
    .replace(/:[a-z_]+:\s*/g, "")
    .trim();
}

export function repoMeta(repo: string) {
  const m = repos[repo];
  return { stars: m?.stars ?? 0, desc: cleanDesc(m?.desc ?? "") };
}

export function repoUrl(repo: string) {
  return `https://github.com/${repo}`;
}

export function formatStars(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(n);
}

export const kindLabel: Record<Resource["kind"], string> = {
  kurikulum: "Kurikulum",
  buku: "Buku",
  latihan: "Latihan",
  proyek: "Proyek",
  referensi: "Referensi",
  awesome: "Awesome List",
  tool: "Tool",
};

export type CatalogEntry = {
  repo: string;
  stars: number;
  desc: string;
  kind: Resource["kind"];
  lang: Resource["lang"];
  note: string;
  paidBook?: boolean;
  tracks: { slug: string; short: string }[];
};

/** Semua repo unik beserta jalur yang memakainya */
export function buildCatalog(): CatalogEntry[] {
  const map = new Map<string, CatalogEntry>();
  const add = (r: Resource, t?: Track) => {
    const existing = map.get(r.repo);
    if (existing) {
      if (t && !existing.tracks.some((x) => x.slug === t.slug)) existing.tracks.push({ slug: t.slug, short: t.short });
      return;
    }
    const m = repoMeta(r.repo);
    map.set(r.repo, { repo: r.repo, stars: m.stars, desc: m.desc, kind: r.kind, lang: r.lang, note: r.note, paidBook: r.paidBook, tracks: t ? [{ slug: t.slug, short: t.short }] : [] });
  };
  for (const t of tracks) for (const s of t.stages) for (const r of s.resources) add(r, t);
  for (const r of foundations) add(r);
  return [...map.values()].sort((a, b) => b.stars - a.stars);
}

export function trackStats(t: Track) {
  const set = new Set<string>();
  t.stages.forEach((s) => s.resources.forEach((r) => set.add(r.repo)));
  const stars = [...set].reduce((a, r) => a + repoMeta(r).stars, 0);
  return { repos: set.size, stages: t.stages.length, topics: t.stages.reduce((a, s) => a + s.topics.length, 0), stars };
}

export function globalStats() {
  const cat = buildCatalog();
  return {
    tracks: tracks.length,
    repos: cat.length,
    stars: cat.reduce((a, c) => a + c.stars, 0),
    stages: tracks.reduce((a, t) => a + t.stages.length, 0),
  };
}

export function hasRepo(repo: string) {
  return repo in repos;
}
