import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { formatStars, kindLabel, repoMeta, repoUrl, type Resource } from "@/data";
import { GitHubMark, IdFlag } from "./icons";

const kindColor: Record<Resource["kind"], string> = {
  kurikulum: "bg-sun-300",
  buku: "bg-[#cfe3ff]",
  latihan: "bg-[#d5f2df]",
  proyek: "bg-[#ffd9cf]",
  referensi: "bg-[#ece4ff]",
  awesome: "bg-sun-100",
  tool: "bg-[#e3ecef]",
};

export function KindBadge({ kind }: { kind: Resource["kind"] }) {
  return <span className={`chip !py-0.5 ${kindColor[kind]}`}>{kindLabel[kind]}</span>;
}

/**
 * Kartu repo. Seluruh kartu dapat diklik (link ‘stretched’ di judul), sementara tag jalur
 * tetap link terpisah — tidak menaruh <a> di dalam <a>, yang tidak valid di HTML.
 */
export function RepoCard({ r, compact = false, tracks = [] }: { r: Resource; compact?: boolean; tracks?: { slug: string; short: string }[] }) {
  const meta = repoMeta(r.repo);
  const [owner, name] = r.repo.split("/");
  return (
    <div className="group card card-hover relative flex h-full flex-col gap-3 !rounded-xl !shadow-hard-sm p-4 hover:!shadow-hard focus-within:!shadow-hard">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-paper">
            <GitHubMark className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">{owner}</p>
            <a
              href={repoUrl(r.repo)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[15px] leading-tight font-bold [overflow-wrap:anywhere] outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-sun-400"
            >
              {name.split(/(?<=[-_.])/).map((part, i) => (
                <span key={i}>{part}<wbr /></span>
              ))}
              <span className="sr-only"> (buka repo {r.repo} di GitHub, tab baru)</span>
            </a>
          </div>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
      </div>
      <p className={`text-sm leading-relaxed text-ink-2 ${compact ? "line-clamp-2" : ""}`}>{r.note}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <KindBadge kind={r.kind} />
        <span className={`chip !py-0.5 ${r.lang === "ID" ? "bg-[#ffd6d6]" : ""}`}>{r.lang === "ID" ? <><IdFlag /> Indonesia</> : "English"}</span>
        {r.paidBook && <span className="chip !border-dashed !py-0.5 !font-medium" title="Kode di repo gratis; buku cetak/ebook-nya berbayar">Pendamping buku</span>}
        <span className="ml-auto flex items-center gap-1 text-xs font-bold" aria-label={`${formatStars(meta.stars)} bintang`}>
          <Star className="size-3.5 fill-sun-400 text-sun-600" aria-hidden />
          {formatStars(meta.stars)}
        </span>
      </div>
      {tracks.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1.5 border-t-2 border-ink/10 pt-3">
          {tracks.map((t) => (
            <Link key={t.slug} href={`/jalur/${t.slug}`} className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink-2 hover:bg-sun-200">#{t.short}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
