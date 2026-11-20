import type { Metadata } from "next";
import Link from "next/link";
import { categories, trackStats, tracks } from "@/data";
import { TrackCard } from "@/components/TrackCard";
import { Reveal } from "@/components/Reveal";
import { TrackIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Semua Jalur Belajar",
  description: `${tracks.length} jalur belajar teknologi gratis: Fondasi IT, Frontend, Backend, Mobile, UI/UX, QA, Game Dev, Data, Machine Learning, Deep Learning, Computer Vision, AI Engineer, Jaringan, DevOps & Cloud, Cyber Security, dan IoT.`,
};

export default function JalurPage() {
  return (
    <div className="container-page pt-12 pb-8">
      <Reveal>
        <span className="eyebrow">Jalur belajar</span>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-6xl">{tracks.length} jalur, satu prinsip: belajar berurutan, bukan menumpuk link.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">Bingung memilih? Lihat tabel perbandingan di bawah, lalu cek peran kerja yang paling sesuai dengan minatmu.</p>
      </Reveal>

      {categories.map((c) => (
        <section key={c.id} className="mt-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-ink pb-3">
              <h2 className="text-2xl font-extrabold">{c.label}</h2>
              <p className="text-sm text-muted">{c.desc}</p>
            </div>
          </Reveal>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.filter((t) => t.category === c.id).map((t, i) => (
              <Reveal key={t.slug} delay={i * 0.05}><TrackCard t={t} /></Reveal>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-20">
        <Reveal>
          <h2 className="text-2xl font-extrabold">Perbandingan cepat</h2>
          <p className="mt-2 text-sm text-muted">Durasi adalah estimasi untuk sekitar 10–15 jam belajar per minggu.</p>
        </Reveal>
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b-2 border-ink bg-sun-100 text-xs tracking-wider uppercase">
              <tr>
                <th className="px-4 py-3">Jalur</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3">Tahap</th>
                <th className="px-4 py-3">Repo</th>
                <th className="px-4 py-3">Peran yang dituju</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => {
                const s = trackStats(t);
                return (
                  <tr key={t.slug} className="border-b border-line last:border-0 hover:bg-sun-50">
                    <td className="px-4 py-3">
                      <Link href={`/jalur/${t.slug}`} className="flex items-center gap-2 font-bold hover:underline">
                        <TrackIcon name={t.icon} className="size-4" /> {t.short}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{t.level}</td>
                    <td className="px-4 py-3 text-muted">{t.duration}</td>
                    <td className="px-4 py-3">{s.stages}</td>
                    <td className="px-4 py-3">{s.repos}</td>
                    <td className="px-4 py-3 text-muted">{t.roles.join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
