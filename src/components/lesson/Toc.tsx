"use client";

import { useEffect, useState } from "react";

export function Toc({ items }: { items: { id: string; text: string; level: 2 | 3 }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [items]);
  return (
    <nav aria-label="Daftar isi">
      <p className="mb-2 text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">Di modul ini</p>
      <ul className="space-y-0.5 border-l-2 border-line">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className={`-ml-0.5 block border-l-2 py-1 text-[13px] leading-snug transition-colors ${i.level === 3 ? "pl-6" : "pl-3"} ${active === i.id ? "border-ink font-bold text-ink" : "border-transparent text-muted hover:text-ink"}`}>
              {i.text}
            </a>
          </li>
        ))}
        <li><a href="#kuis" className={`-ml-0.5 block border-l-2 py-1 pl-3 text-[13px] ${active === "kuis" ? "border-ink font-bold" : "border-transparent text-muted hover:text-ink"}`}>Kuis</a></li>
      </ul>
    </nav>
  );
}
