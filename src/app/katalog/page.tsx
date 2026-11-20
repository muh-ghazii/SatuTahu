import type { Metadata } from "next";
import { globalStats, SNAPSHOT_DATE } from "@/data";
import { Catalog } from "@/components/Catalog";

export const metadata: Metadata = {
  title: "Katalog Repo GitHub",
  description: "Semua repositori GitHub gratis yang dikurasi SatuTahu: kurikulum, buku, latihan, proyek, dan tool, bisa dicari dan difilter.",
};

export default function KatalogPage() {
  const s = globalStats();
  return (
    <div className="container-page pt-12">
      <span className="eyebrow">Katalog</span>
      <h1 className="mt-4 max-w-3xl text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-6xl">{s.repos} repo, semuanya gratis &amp; terverifikasi.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
        Cari berdasarkan topik, filter per jalur atau jenis materi. Setiap kartu memuat catatan kurator tentang cara memakainya. Jumlah bintang per {SNAPSHOT_DATE}.
      </p>
      <div className="mt-10">
        <Catalog />
      </div>
    </div>
  );
}
