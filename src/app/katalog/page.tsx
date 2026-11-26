import type { Metadata } from "next";
import { globalStats, SNAPSHOT_DATE } from "@/data";
import { Catalog } from "@/components/Catalog";

export const metadata: Metadata = {
  title: "Katalog Repo GitHub, Buku & Web Rujukan",
  description: "Semua repositori GitHub, buku gratis, dokumentasi resmi, dan lab interaktif pilihan SatuTahu untuk seluruh 19 jalur teknologi.",
};

export default function KatalogPage() {
  const s = globalStats();
  return (
    <div className="container-page pt-8 sm:pt-12">
      <span className="eyebrow">Katalog sumber belajar</span>
      <h1 className="mt-4 max-w-3xl text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {s.repos} repo GitHub + {s.external} buku &amp; web pilihan.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
        Cari berdasarkan topik, filter per jalur, bahasa (Indonesia / English), atau jenis sumber. Setiap entri memuat catatan kurator tentang cara memakainya. Snapshot bintang GitHub per {SNAPSHOT_DATE}.
      </p>
      <div className="mt-8 sm:mt-10">
        <Catalog />
      </div>
    </div>
  );
}
