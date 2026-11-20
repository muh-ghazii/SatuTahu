import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { tracks } from "@/data";
import { slugify } from "./slug";

export type QuizItem = { q: string; options: string[]; answer: number; explain: string };
export type ModuleSource = { repo: string; note: string };
export type ModuleMeta = {
  title: string;
  minutes: number;
  summary: string;
  objectives: string[];
  sources: ModuleSource[];
  quiz: QuizItem[];
};
export type LessonModule = ModuleMeta & {
  track: string;
  stage: string;
  body: string;
  toc: { id: string; text: string; level: 2 | 3 }[];
};

const ROOT = path.join(process.cwd(), "content");

function fileFor(track: string, stage: string) {
  return path.join(ROOT, track, `${stage}.md`);
}

export function hasModule(track: string, stage: string) {
  return fs.existsSync(fileFor(track, stage));
}

export function getModule(track: string, stage: string): LessonModule | null {
  const f = fileFor(track, stage);
  if (!fs.existsSync(f)) return null;
  const { data, content } = matter(fs.readFileSync(f, "utf8"));
  const toc: LessonModule["toc"] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(##|###)\s+(.+?)\s*$/.exec(line);
    if (m) toc.push({ level: m[1].length as 2 | 3, text: m[2].replace(/`/g, ""), id: slugify(m[2].replace(/`/g, "")) });
  }
  const meta = data as Partial<ModuleMeta>;
  return {
    track,
    stage,
    title: meta.title ?? stage,
    minutes: meta.minutes ?? 20,
    summary: meta.summary ?? "",
    objectives: meta.objectives ?? [],
    sources: meta.sources ?? [],
    quiz: meta.quiz ?? [],
    body: content,
    toc,
  };
}

/** Semua pasangan [track, stage] yang memiliki modul */
export function allModuleParams() {
  return tracks.flatMap((t) => t.stages.filter((s) => hasModule(t.slug, s.id)).map((s) => ({ track: t.slug, stage: s.id })));
}

export function moduleCount() {
  return allModuleParams().length;
}
