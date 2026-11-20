import Link from "next/link";
import { tracks, SNAPSHOT_DATE } from "@/data";
import { Logo } from "./Logo";

export function Footer() {
  const sw = tracks.filter((t) => t.category === "software");
  const other = tracks.filter((t) => t.category !== "software");
  return (
    <footer className="mt-24 border-t-2 border-ink bg-ink text-paper">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="inline-flex rounded-2xl bg-cream px-3 py-2"><Logo /></div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/70">
            Modul belajar teknologi gratis berbahasa Indonesia, disusun berurutan dari repositori GitHub terbaik.
          </p>
          <p className="mt-4 text-xs text-paper/50">Data bintang GitHub per {SNAPSHOT_DATE}.</p>
        </div>
        <FooterCol title="Software Dev" items={sw.map((t) => ({ href: `/jalur/${t.slug}`, label: t.short }))} />
        <FooterCol title="Data, AI & Jaringan" items={other.map((t) => ({ href: `/jalur/${t.slug}`, label: t.short }))} />
        <FooterCol
          title="SatuTahu"
          items={[
            { href: "/jalur", label: "Semua Jalur" },
            { href: "/katalog", label: "Katalog Repo" },
            { href: "/progres", label: "Progres Saya" },
            { href: "/#faq", label: "FAQ" },
          ]}
        />
      </div>
      <div className="border-t border-paper/15">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SatuTahu. Modul ditulis ulang dengan kredit ke repositori sumber; hak cipta sumber asli tetap milik pembuatnya.</p>
          <p>Satu tahu, semua jadi tahu. 🟨</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-extrabold tracking-[0.14em] text-sun-400 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="text-sm text-paper/80 transition-colors hover:text-sun-300">{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
