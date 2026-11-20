import { tracks, foundations, hasRepo, buildCatalog, globalStats } from "../src/data/index";
let bad = 0;
const slugs = new Set(tracks.map((t) => t.slug));
for (const t of tracks) {
  for (const s of t.stages) for (const r of s.resources) if (!hasRepo(r.repo)) { console.log("MISSING", t.slug, r.repo); bad++; }
  for (const rel of t.related) if (!slugs.has(rel)) { console.log("BAD RELATED", t.slug, rel); bad++; }
}
for (const r of foundations) if (!hasRepo(r.repo)) { console.log("MISSING foundation", r.repo); bad++; }
console.log(globalStats(), "catalog", buildCatalog().length, "errors", bad);
process.exit(bad ? 1 : 0);
