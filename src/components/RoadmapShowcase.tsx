"use client";

import { useState } from "react";
import { tracks } from "@/data";
import { RoadmapMap } from "./RoadmapMap";
import { TrackIcon } from "./icons";

const featured = ["frontend", "data-scientist", "ai-engineer", "computer-vision", "jaringan"];

export function RoadmapShowcase() {
  const list = featured.map((s) => tracks.find((t) => t.slug === s)!).filter(Boolean);
  const [slug, setSlug] = useState(list[0].slug);
  const track = list.find((t) => t.slug === slug)!;
  return (
    <div className="card p-5 sm:p-7">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {list.map((t) => (
          <button
            key={t.slug}
            onClick={() => setSlug(t.slug)}
            className={`flex shrink-0 items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition-all ${
              t.slug === slug ? "border-ink bg-ink text-sun-300" : "border-line bg-cream text-muted hover:border-ink hover:text-ink"
            }`}
          >
            <TrackIcon name={t.icon} className="size-4" />
            {t.short}
          </button>
        ))}
      </div>
      <div className="mt-7">
        <RoadmapMap key={track.slug} track={track} />
      </div>
    </div>
  );
}
