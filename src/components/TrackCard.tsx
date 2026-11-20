import Link from "next/link";
import { ArrowRight, Clock, Layers } from "lucide-react";
import { trackStats, type Track } from "@/data";
import { TrackIcon, GitHubMark } from "./icons";

const catTint = { fondasi: "bg-[#ffd9cf]", software: "bg-sun-300", data: "bg-[#cfe3ff]", infra: "bg-[#d5f2df]" } as const;

export function TrackCard({ t }: { t: Track }) {
  const s = trackStats(t);
  return (
    <Link href={`/jalur/${t.slug}`} className="group card card-hover relative flex h-full flex-col overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <span className={`grid size-12 place-items-center rounded-xl border-2 border-ink ${catTint[t.category]} transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105`}>
          <TrackIcon name={t.icon} className="size-6" strokeWidth={2.2} />
        </span>
        <span className="chip">{t.level}</span>
      </div>
      <h3 className="mt-4 text-lg leading-snug font-extrabold">{t.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.tagline}</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 border-t-2 border-dashed border-line pt-4 text-xs font-semibold text-ink-2">
        <span className="flex items-center gap-1.5"><Layers className="size-3.5" />{s.stages} tahap</span>
        <span className="flex items-center gap-1.5"><GitHubMark className="size-3.5" />{s.repos} repo</span>
        <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{t.duration}</span>
      </div>
      <span className="absolute right-4 bottom-4 grid size-8 translate-x-2 place-items-center rounded-full border-2 border-ink bg-sun-400 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
