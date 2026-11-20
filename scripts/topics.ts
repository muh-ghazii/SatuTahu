import { getTrack } from "../src/data/index";
const t = getTrack(process.argv[2])!;
for (const s of t.stages) console.log(`${s.id} | ${s.title}\n   ${s.topics.join(" ; ")}\n   repos: ${s.resources.map((r) => r.repo).join(", ")}`);
