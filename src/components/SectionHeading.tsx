import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, desc, align = "center" }: { eyebrow: string; title: ReactNode; desc?: ReactNode; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-4 text-3xl leading-[1.12] font-extrabold tracking-tight text-balance sm:text-[42px]">{title}</h2>
      {desc && <p className="mt-4 text-[17px] leading-relaxed text-muted text-pretty">{desc}</p>}
    </div>
  );
}
