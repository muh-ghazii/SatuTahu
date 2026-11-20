"use client";

import type { ReactNode } from "react";
import { MousePointerClick } from "lucide-react";

export function VizFrame({ title, caption, children, controls, hint = "Interaktif" }: { title?: string; caption?: ReactNode; children: ReactNode; controls?: ReactNode; hint?: string }) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-hard">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-sun-100 px-4 py-2.5 sm:px-5">
        <figcaption className="text-[15px] font-extrabold">{title}</figcaption>
        <span className="flex items-center gap-1 rounded-full border-[1.5px] border-ink bg-paper px-2 py-0.5 text-[10px] font-extrabold tracking-[0.12em] uppercase">
          <MousePointerClick className="size-3" /> {hint}
        </span>
      </div>
      {controls && <div className="flex flex-wrap items-center gap-2 border-b border-line bg-cream/60 px-4 py-3 sm:px-5">{controls}</div>}
      <div className="bg-grid-ink p-4 sm:p-5">{children}</div>
      {caption && <p className="border-t border-line px-4 py-3 text-[13.5px] leading-relaxed text-muted sm:px-5">{caption}</p>}
    </figure>
  );
}

export function Btn({ children, onClick, active, disabled, title }: { children: ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-ink px-2.5 py-1 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-ink text-sun-300" : "bg-paper shadow-hard-sm hover:-translate-y-px active:translate-y-0.5 active:shadow-none"
      }`}
    >
      {children}
    </button>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-bold">
      <span className="flex justify-between gap-2"><span>{label}</span><span className="font-mono text-ink-3">{format ? format(value) : value}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#f5b316]" />
    </label>
  );
}

export function Stat({ k, v, tone }: { k: string; v: ReactNode; tone?: "good" | "bad" | "warn" }) {
  const c = tone === "good" ? "bg-[#dff5e7]" : tone === "bad" ? "bg-[#ffe4dc]" : tone === "warn" ? "bg-sun-100" : "bg-paper";
  return (
    <div className={`rounded-lg border-2 border-ink px-3 py-2 ${c}`}>
      <p className="text-[10px] font-extrabold tracking-wider text-muted uppercase">{k}</p>
      <p className="font-mono text-sm font-bold">{v}</p>
    </div>
  );
}
