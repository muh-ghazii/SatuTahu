import type { Metadata } from "next";
import { Suspense } from "react";
import { LessonSkeleton } from "@/components/Skeletons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookMarked, BookOpen, Clock, Flag, Layers, ListChecks, Target } from "lucide-react";
import { getTrack, repoUrl, sourcesForTrack } from "@/data";
import { allModuleParams, getModule } from "@/lib/modules";
import { Markdown } from "@/components/lesson/Markdown";
import { Quiz } from "@/components/lesson/Quiz";
import { Toc } from "@/components/lesson/Toc";
import { LessonChecklist, ModuleNav } from "@/components/lesson/LessonProgress";
import { ReadingProgress } from "@/components/lesson/ReadingProgress";
import { StudyToolbar } from "@/components/lesson/StudyToolbar";
import { GitHubMark, TrackIcon } from "@/components/icons";

export function generateStaticParams() {
  return allModuleParams();
}

export async function generateMetadata({ params }: PageProps<"/belajar/[track]/[stage]">): Promise<Metadata> {
  const { track, stage } = await params;
  const m = getModule(track, stage);
  const t = getTrack(track);
  if (!m || !t) return {};
  return { title: `${m.title} · ${t.short}`, description: m.summary };
}

export default function LessonPage({ params }: PageProps<"/belajar/[track]/[stage]">) {
  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContent params={params} />
    </Suspense>
  );
}

async function LessonContent({ params }: { params: PageProps<"/belajar/[track]/[stage]">["params"] }) {
  const { track: slug, stage: stageId } = await params;
  const t = getTrack(slug);
  const m = getModule(slug, stageId);
  if (!t || !m) notFound();
  const idx = t.stages.findIndex((s) => s.id === stageId);
  const stage = t.stages[idx];
  const prev = t.stages[idx - 1];
  const next = t.stages[idx + 1];
  const extSources = sourcesForTrack(t.slug).slice(0, 4);

  return (
    <>
      <ReadingProgress />
      <header className="relative overflow-hidden border-b-2 border-ink bg-sun-100">
        <div className="bg-grid-ink absolute inset-0" />
        <div className="container-page relative py-8 sm:py-10">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-2">
            <Link href="/jalur" className="hover:underline">Jalur</Link><span>/</span>
            <Link href={`/jalur/${t.slug}`} className="flex items-center gap-1 hover:underline"><TrackIcon name={t.icon} className="size-4" />{t.short}</Link><span>/</span>
            <span className="text-muted">Modul {idx + 1}</span>
          </nav>
          <h1 className="mt-4 max-w-4xl text-3xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">{m.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-2">{m.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip !bg-paper"><Clock className="size-3.5" /> {m.minutes} menit baca</span>
            <span className="chip !bg-paper"><Layers className="size-3.5" /> {stage.topics.length} topik</span>
            <span className="chip !bg-paper"><BookOpen className="size-3.5" /> Modul {idx + 1} dari {t.stages.length}</span>
            <span className="chip !bg-paper"><ListChecks className="size-3.5" /> {m.quiz.length} soal kuis</span>
          </div>
        </div>
      </header>

      <div id="lesson-shell" className="container-page grid gap-8 pt-6 sm:pt-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[250px_minmax(0,1fr)_210px]">
        <aside aria-label="Daftar modul" className="lesson-sidebar hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 pb-6">
            <ModuleNav track={t} current={stageId} />
          </div>
        </aside>

        <article className="min-w-0">
          <StudyToolbar track={t} stageId={stageId} title={m.title} toc={m.toc} />

          {m.objectives.length > 0 && (
            <div className="card mb-10 p-5">
              <p className="flex items-center gap-2 text-sm font-extrabold"><Target className="size-4" /> Setelah modul ini kamu bisa:</p>
              <ul className="mt-3 space-y-2">
                {m.objectives.map((o) => <li key={o} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-sun-400 ring-2 ring-ink" />{o}</li>)}
              </ul>
            </div>
          )}

          <div className="lesson-body">
            <Markdown source={m.body} />
          </div>

          <div className="mt-14 rounded-2xl border-2 border-ink bg-sun-300 p-5 sm:p-6">
            <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] uppercase"><Flag className="size-4" /> Milestone tahap ini</p>
            <p className="mt-2 text-lg leading-snug font-bold">{stage.milestone}</p>
            <p className="mt-2 text-sm text-ink-2">Kerjakan milestone ini sebelum lanjut. Membangun sesuatu adalah cara tercepat menemukan bagian yang belum benar-benar kamu pahami.</p>
          </div>

          <div className="mt-10"><LessonChecklist track={t} stageId={stageId} /></div>

          {m.quiz.length > 0 && <div className="mt-14"><Quiz items={m.quiz} /></div>}

          {(m.sources.length > 0 || extSources.length > 0) && (
            <section className="mt-14 space-y-5 rounded-2xl border-2 border-dashed border-ink/40 p-5">
              {m.sources.length > 0 && (
                <div>
                  <p className="text-sm font-extrabold">Sumber GitHub &amp; kredit</p>
                  <p className="mt-1 text-sm text-muted">Modul ini ditulis ulang dalam Bahasa Indonesia oleh SatuTahu dengan merujuk materi terbuka berikut. Hak cipta dan lisensi materi asli tetap milik pembuatnya.</p>
                  <ul className="mt-3 space-y-2">
                    {m.sources.map((s) => (
                      <li key={s.repo} className="flex items-start gap-2 text-sm">
                        <GitHubMark className="mt-0.5 size-4 shrink-0" />
                        <span className="min-w-0"><a href={repoUrl(s.repo)} target="_blank" rel="noopener noreferrer" className="font-mono font-bold [overflow-wrap:anywhere] hover:underline">{s.repo}</a>: <span className="text-muted">{s.note}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {extSources.length > 0 && (
                <div className={m.sources.length > 0 ? "border-t-2 border-dashed border-line pt-4" : ""}>
                  <p className="flex items-center gap-1.5 text-sm font-extrabold"><BookMarked className="size-4" /> Buku &amp; web rujukan lanjutan ({t.short})</p>
                  <ul className="mt-2.5 space-y-2">
                    {extSources.map((src) => (
                      <li key={src.id} className="text-sm">
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-sun-400 decoration-2 underline-offset-2 hover:bg-sun-100">
                          {src.title} ↗
                        </a>{" "}
                        <span className="text-xs text-muted">({src.author}) — {src.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <nav aria-label="Modul sebelumnya dan berikutnya" className="mt-12 grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link href={`/belajar/${t.slug}/${prev.id}`} className="card card-hover p-4">
                <span className="flex items-center gap-1 text-xs font-bold text-muted"><ArrowLeft className="size-3.5" /> Modul sebelumnya</span>
                <span className="mt-1 block font-extrabold">{prev.title}</span>
              </Link>
            ) : <Link href={`/jalur/${t.slug}`} className="card card-hover p-4"><span className="text-xs font-bold text-muted">← Kembali ke</span><span className="mt-1 block font-extrabold">Roadmap {t.short}</span></Link>}
            {next ? (
              <Link href={`/belajar/${t.slug}/${next.id}`} className="card card-hover p-4 text-right !bg-sun-400">
                <span className="flex items-center justify-end gap-1 text-xs font-bold">Modul berikutnya <ArrowRight className="size-3.5" /></span>
                <span className="mt-1 block font-extrabold">{next.title}</span>
              </Link>
            ) : <Link href="/progres" className="card card-hover p-4 text-right !bg-sun-400"><span className="text-xs font-bold">Jalur selesai 🎉</span><span className="mt-1 block font-extrabold">Lihat progresmu</span></Link>}
          </nav>
        </article>

        <aside aria-label="Daftar isi modul" className="lesson-toc hidden xl:block">
          <div className="sticky top-24"><Toc items={m.toc} /></div>
        </aside>
      </div>
    </>
  );
}
