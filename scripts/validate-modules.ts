import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { tracks, hasRepo } from "../src/data/index";
import { ALL_VIZ } from "../src/components/viz/types";

const only = process.argv[2];
let errors = 0, written = 0, missing: string[] = [];
const err = (m: string) => { console.log("✗", m); errors++; };
for (const t of tracks) {
  if (only && t.slug !== only) continue;
  for (const s of t.stages) {
    const f = path.join("content", t.slug, `${s.id}.md`);
    if (!fs.existsSync(f)) { missing.push(`${t.slug}/${s.id}`); continue; }
    written++;
    const { data, content } = matter(fs.readFileSync(f, "utf8"));
    const id = `${t.slug}/${s.id}`;
    for (const k of ["title", "minutes", "summary", "objectives", "sources", "quiz"]) if (!(k in data)) err(`${id}: frontmatter '${k}' hilang`);
    (data.sources ?? []).forEach((x: { repo: string }) => { if (!hasRepo(x.repo)) err(`${id}: source tidak dikenal ${x.repo}`); });
    (data.quiz ?? []).forEach((q: { options: string[]; answer: number; q: string }, i: number) => {
      if (!Array.isArray(q.options) || q.answer < 0 || q.answer >= q.options.length) err(`${id}: kuis #${i + 1} jawaban di luar opsi`);
      if (!(q as { explain?: string }).explain) err(`${id}: kuis #${i + 1} tanpa explain`);
    });
    if ((data.quiz ?? []).length < 3) err(`${id}: kuis < 3 soal`);
    // heading
    let fence = false;
    const h2: string[] = [];
    const vizBlocks: string[] = [];
    let cur: string[] | null = null;
    for (const line of content.split("\n")) {
      const fm = /^```(\w*)/.exec(line);
      if (fm && !fence) { fence = true; if (fm[1] === "viz") cur = []; continue; }
      if (/^```\s*$/.test(line) && fence) { fence = false; if (cur) { vizBlocks.push(cur.join("\n")); cur = null; } continue; }
      if (fence) { cur?.push(line); continue; }
      const m = /^## (.+)$/.exec(line);
      if (m && m[1].trim() !== "Rangkuman") h2.push(m[1].trim());
    }
    if (fence) err(`${id}: code fence tidak ditutup`);
    if (h2.length !== s.topics.length) err(`${id}: ${h2.length} sub-bab, tetapi topik ${s.topics.length} → [${h2.join(" | ")}]`);
    if (vizBlocks.length === 0) err(`${id}: tidak ada visualisasi`);
    vizBlocks.forEach((v, i) => {
      try { const o = JSON.parse(v); if (!ALL_VIZ.includes(o.type)) err(`${id}: viz #${i + 1} tipe '${o.type}' tidak dikenal`); }
      catch (e) { err(`${id}: viz #${i + 1} JSON tidak valid (${(e as Error).message.slice(0, 60)})`); }
    });
    const words = content.split(/\s+/).length;
    if (words < 700) err(`${id}: terlalu pendek (${words} kata)`);
  }
}
console.log(`\nModul ditulis: ${written}, belum: ${missing.length}, error: ${errors}`);
if (process.argv.includes("--missing")) console.log(missing.join("\n"));
process.exit(errors ? 1 : 0);
