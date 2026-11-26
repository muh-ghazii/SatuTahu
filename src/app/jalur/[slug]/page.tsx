import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackSkeleton } from "@/components/Skeletons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookMarked, Briefcase, Clock, FileCode2, Lightbulb, ShieldAlert, Signal, Sparkles, Star, Wrench } from "lucide-react";
import { formatStars, getTrack, getTrackGuide, sourcesForTrack, trackStats, tracks } from "@/data";
import { TrackIcon, GitHubMark } from "@/components/icons";
import { ConceptFlow } from "@/components/ConceptFlow";
import { RoadmapMap } from "@/components/RoadmapMap";
import { StageNav, StageSection } from "@/components/StageSection";
import { TrackProgressCard } from "@/components/TrackProgress";
import { TrackCard } from "@/components/TrackCard";
import { ExternalSourceCard } from "@/components/Catalog";
import { Reveal } from "@/components/Reveal";

export function generateStaticParams() {
  return tracks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/jalur/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = getTrack(slug);
  if (!t) return {};
  return { title: `Roadmap ${t.name}`, description: `${t.tagline} ${t.stages.length} modul berbahasa Indonesia dengan visualisasi & kuis, disusun dari ${trackStats(t).repos} repo GitHub gratis.` };
}

export default function TrackPage({ params }: PageProps<"/jalur/[slug]">) {
  return (
    <Suspense fallback={<TrackSkeleton />}>
      <TrackContent params={params} />
    </Suspense>
  );
}

async function TrackContent({ params }: { params: PageProps<"/jalur/[slug]">["params"] }) {
  const { slug } = await params;
  const t = getTrack(slug);
  if (!t) notFound();
  const s = trackStats(t);
  const related = t.related.map((r) => getTrack(r)!).filter(Boolean);
  const guide = getTrackGuide(t.slug);
  const extSources = sourcesForTrack(t.slug);

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-sun-300">
        <div className="bg-grid-ink absolute inset-0" />
        <div className="container-page relative grid gap-10 pt-8 pb-12 lg:grid-cols-[1.5fr_1fr] lg:pb-16">
          <div>
            <Link href="/jalur" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:underline">
              <ArrowLeft className="size-4" /> Semua jalur
            </Link>
            <div className="mt-6 flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-2xl border-2 border-ink bg-paper shadow-hard">
                <TrackIcon name={t.icon} className="size-8" strokeWidth={2.1} />
              </span>
              <span className="eyebrow !bg-paper">Roadmap {t.short}</span>
            </div>
            <h1 className="mt-5 text-4xl leading-[1.06] font-extrabold tracking-tight text-balance sm:text-[54px]">{t.name}</h1>
            <p className="mt-3 text-xl font-semibold text-ink-2">{t.tagline}</p>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-2/90">{t.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {t.tools.map((tool) => (
                <span key={tool} className="chip !bg-paper/80">{tool}</span>
              ))}
            </div>
          </div>

          <div className="card self-start p-5 sm:p-6">
            <TrackProgressCard track={t} />
            <dl className="mt-6 grid grid-cols-2 gap-3 border-t-2 border-dashed border-line pt-5 text-sm">
              <Meta icon={<Signal className="size-4" />} k="Level" v={t.level} />
              <Meta icon={<Clock className="size-4" />} k="Estimasi" v={t.duration} />
              <Meta icon={<GitHubMark className="size-4" />} k="Repo rujukan" v={`${s.repos} repo`} />
              <Meta icon={<Star className="size-4" />} k="Total bintang" v={formatStars(s.stars)} />
            </dl>
            <div className="mt-5 border-t-2 border-dashed border-line pt-4">
              <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.12em] text-muted uppercase"><Briefcase className="size-3.5" /> Peran kerja</p>
              <p className="mt-2 text-sm font-semibold">{t.roles.join(" · ")}</p>
            </div>
            <Link href={`/belajar/${t.slug}/${t.stages[0].id}`} className="btn btn-primary mt-5 w-full !py-3">
              Mulai modul 1: {t.stages[0].title} <ArrowRight className="size-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Visual */}
      <section className="container-page pt-14">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Roadmap {s.stages} tahap</h2>
            <p className="text-sm text-muted">Klik stasiun untuk melihat ringkasannya</p>
          </div>
          <div className="card mt-5 p-5 sm:p-7">
            <RoadmapMap track={t} linkStages />
          </div>
        </Reveal>
        <Reveal delay={0.05} className="mt-12">
          <h2 className="mb-5 text-2xl font-extrabold sm:text-3xl">Pahami gambaran besarnya</h2>
          <ConceptFlow {...t.concept} />
        </Reveal>

        {guide && (
          <Reveal delay={0.08} className="mt-12">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="card bg-sun-50 p-5 sm:p-6">
                <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] text-ink-3 uppercase">
                  <Sparkles className="size-4" /> Analogi mudah untuk pemula
                </p>
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink">{guide.analogy}</p>
                <div className="mt-4 rounded-xl border-2 border-ink/20 bg-paper p-3.5 text-sm leading-relaxed text-ink-2">
                  <span className="font-extrabold text-ink">Tips fokus belajar: </span>
                  {guide.focusTip}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/cheatsheet?jalur=${t.slug}`} className="btn btn-primary !px-4 !py-2 !text-xs">
                    <FileCode2 className="size-4" /> Buka Cheatsheet &amp; Flashcard {t.short}
                  </Link>
                  <Link href="/game" className="btn btn-ghost !px-4 !py-2 !text-xs">
                    Latihan di Arena Game
                  </Link>
                </div>
              </div>

              <div className="card bg-paper p-5 sm:p-6">
                <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] text-[#b4362c] uppercase">
                  <ShieldAlert className="size-4" /> Kesalahan umum pemula &amp; solusinya
                </p>
                <ul className="mt-3 space-y-3">
                  {guide.mistakes.map((m, idx) => (
                    <li key={idx} className="rounded-xl border-2 border-line bg-cream/60 p-3 text-sm">
                      <p className="font-bold text-ink">✗ {m.wrong}</p>
                      <p className="mt-1 text-ink-2">
                        <span className="font-bold text-[#1d7a46]">✓ Solusi:</span> {m.fix}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        )}
      </section>

      {/* Stages */}
      <section className="container-page pt-16">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Materi per tahap</h2>
        <p className="mt-2 max-w-2xl text-muted">Setiap tahap punya modul lengkap yang dibaca langsung di SatuTahu. Centang topik yang sudah kamu kuasai; progres tersimpan otomatis di browser ini.</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <StageNav track={t} />
            </div>
          </aside>
          <div className="flex flex-col gap-8">
            {t.stages.map((st, i) => (
              <StageSection key={st.id} track={t} stage={st} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Buku & Web Pilihan */}
      {extSources.length > 0 && (
        <section className="container-page pt-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-[#cfe3ff]"><BookMarked className="size-5" /></span>
                <div>
                  <h2 className="text-2xl font-extrabold sm:text-3xl">Buku &amp; website rujukan terbaik</h2>
                  <p className="mt-1 text-sm text-muted">Pelengkap modul SatuTahu dari buku klasik gratis, dokumentasi resmi, dan lab interaktif.</p>
                </div>
              </div>
              <Link href="/katalog" className="inline-flex items-center gap-1 text-sm font-bold hover:underline">Lihat semua katalog <ArrowRight className="size-4" /></Link>
            </div>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {extSources.map((src) => (
              <ExternalSourceCard key={src.id} source={src} showTracks={false} />
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      <section className="container-page pt-20">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-sun-400"><Lightbulb className="size-5" /></span>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Ide proyek portofolio</h2>
          </div>
        </Reveal>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {t.projects.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <div className="card h-full p-5">
                <Wrench className="size-5 text-ink-3" />
                <h3 className="mt-3 font-extrabold">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="container-page pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Jalur yang berkaitan</h2>
          <Link href="/jalur" className="inline-flex items-center gap-1 text-sm font-bold hover:underline">Lihat semua <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {related.map((r) => <TrackCard key={r.slug} t={r} />)}
        </div>
      </section>
    </>
  );
}

function Meta({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted">{icon}{k}</dt>
      <dd className="mt-0.5 font-bold">{v}</dd>
    </div>
  );
}
