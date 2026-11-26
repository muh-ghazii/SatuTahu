"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Code2, Compass, Gamepad2, Home } from "lucide-react";

const TABS = [
  { href: "/", label: "Beranda", Icon: Home, match: (p: string) => p === "/" },
  { href: "/jalur", label: "Jalur", Icon: Compass, match: (p: string) => p.startsWith("/jalur") || p.startsWith("/belajar") },
  { href: "/game", label: "Game", Icon: Gamepad2, match: (p: string) => p.startsWith("/game") },
  { href: "/playground", label: "Lab", Icon: Code2, match: (p: string) => p.startsWith("/playground") || p.startsWith("/cheatsheet") },
  { href: "/progres", label: "Progres", Icon: Award, match: (p: string) => p.startsWith("/progres") || p.startsWith("/akun") },
] as const;

/** Bottom navigation khusus handphone & tablet (< lg) bergaya aplikasi native */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi seluler"
      className="fixed right-0 bottom-0 left-0 z-40 border-t-2 border-ink bg-cream/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 py-1.5">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-bold transition-colors ${
                  active ? "bg-sun-400 text-ink shadow-[2px_2px_0_0_var(--color-ink)] ring-1 ring-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
