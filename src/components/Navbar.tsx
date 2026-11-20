"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "./Logo";
import { CommandPalette } from "./CommandPalette";
import { AccountMenu, MobileAccountLinks } from "./auth/AccountMenu";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/jalur", label: "Jalur Belajar" },
  { href: "/katalog", label: "Katalog Repo" },
  { href: "/progres", label: "Progres Saya" },
  { href: "/#cara-belajar", label: "Cara Belajar" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b-2 transition-colors duration-200 ${
          scrolled ? "border-ink bg-cream/90 backdrop-blur-md" : "border-transparent bg-cream"
        }`}
      >
        <nav aria-label="Navigasi utama" className="container-page flex h-[72px] items-center justify-between gap-4">
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : l.href !== "/#cara-belajar" && pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors hover:text-ink ${
                      active ? "text-ink" : "text-muted"
                    }`}
                  >
                    {active && (
                      <motion.span layoutId="nav-active" className="absolute inset-0 -z-10 rounded-lg bg-sun-200" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm text-muted transition-colors hover:bg-sun-50 sm:flex"
            >
              <Search className="size-4" aria-hidden />
              <span className="sr-only pr-4 xl:not-sr-only">Cari materi…</span>
              <kbd className="rounded-md border border-ink/30 bg-cream px-1.5 font-mono text-[11px] text-ink">Ctrl K</kbd>
            </button>
            <button onClick={() => setPaletteOpen(true)} className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-paper sm:hidden" aria-label="Cari">
              <Search className="size-4" />
            </button>
            <Link href="/jalur" className="btn btn-primary hidden !py-2 md:inline-flex">
              Mulai Belajar
            </Link>
            <AccountMenu />
            <button
              className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-paper lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Menu"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t-2 border-ink bg-cream lg:hidden"
            >
              <ul className="container-page flex flex-col gap-1 py-4">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block rounded-lg px-3 py-3 font-semibold hover:bg-sun-100">
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/jalur" className="btn btn-primary w-full">Mulai Belajar</Link>
                </li>
                <li>
                  <MobileAccountLinks />
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
