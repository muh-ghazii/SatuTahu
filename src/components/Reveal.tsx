import type { CSSProperties, ElementType, ReactNode } from "react";

/** Animasi muncul saat discroll, murni CSS. Konten selalu terlihat walau JavaScript belum siap. */
export function Reveal({ children, className, y = 18, as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; y?: number; as?: ElementType }) {
  return (
    <Tag className={["reveal", className].filter(Boolean).join(" ")} style={{ "--enter-y": `${y}px` } as CSSProperties}>
      {children}
    </Tag>
  );
}
