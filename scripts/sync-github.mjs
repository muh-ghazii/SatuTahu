// Memperbarui jumlah bintang & deskripsi repo di src/data/repos.json dari GitHub API.
// Pakai: npm run sync:github
// Opsional: set GITHUB_TOKEN agar tidak terkena rate limit (60 request/jam tanpa token).
import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../src/data/repos.json", import.meta.url);
const repos = JSON.parse(await readFile(FILE, "utf8"));
const headers = { Accept: "application/vnd.github+json", "User-Agent": "satutahu-sync" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

let updated = 0;
const problems = [];
for (const name of Object.keys(repos)) {
  const res = await fetch(`https://api.github.com/repos/${name}`, { headers });
  if (res.status === 403 || res.status === 429) {
    console.error("Rate limit tercapai. Set GITHUB_TOKEN lalu jalankan ulang.");
    break;
  }
  if (!res.ok) { problems.push(`${name}: HTTP ${res.status}`); continue; }
  const d = await res.json();
  if (d.full_name.toLowerCase() !== name.toLowerCase()) problems.push(`${name} → pindah ke ${d.full_name} (perbarui di file tracks-*.ts)`);
  if (d.archived) problems.push(`${name}: diarsipkan pemiliknya`);
  repos[name] = { stars: d.stargazers_count, desc: d.description ?? "" };
  updated++;
  process.stdout.write(`\r${updated}/${Object.keys(repos).length}`);
}
await writeFile(FILE, JSON.stringify(repos, null, 0).replace(/,"/g, ',\n"'));
console.log(`\nSelesai: ${updated} repo diperbarui.`);
if (problems.length) console.log("Perlu dicek:\n- " + problems.join("\n- "));
console.log("Jangan lupa ubah SNAPSHOT_DATE di src/data/index.ts.");
