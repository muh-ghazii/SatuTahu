import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import rehypeShiki from "@shikijs/rehype";
import type { ReactNode } from "react";
import { Lightbulb, Info, TriangleAlert, PencilLine, Sparkles, FileCode2, ShieldAlert, Briefcase, Eye } from "lucide-react";
import { remarkSatuTahu } from "@/lib/remark-satutahu";
import { slugify } from "@/lib/slug";
import { CopyButton } from "./CopyButton";
import { Viz } from "../viz/Viz";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

const calloutStyle: Record<string, { label: string; cls: string; Icon: typeof Info }> = {
  tip: { label: "Tips", cls: "bg-sun-100 border-ink", Icon: Lightbulb },
  info: { label: "Catatan", cls: "bg-[#e6f0ff] border-ink", Icon: Info },
  warning: { label: "Hati-hati", cls: "bg-[#ffe4dc] border-ink", Icon: TriangleAlert },
  latihan: { label: "Coba sendiri", cls: "bg-[#dff5e7] border-ink", Icon: PencilLine },
  analogi: { label: "Analogi", cls: "bg-[#f0e9ff] border-ink", Icon: Sparkles },
  contoh: { label: "Contoh", cls: "bg-paper border-ink", Icon: FileCode2 },
  jebakan: { label: "Kesalahan umum pemula", cls: "bg-[#ffe8e6] border-ink", Icon: ShieldAlert },
  kasus: { label: "Studi kasus nyata", cls: "bg-[#e7f4ff] border-ink", Icon: Briefcase },
};

export async function Markdown({ source }: { source: string }) {
  "use cache";
  return (
    <MarkdownAsync
      remarkPlugins={[remarkGfm, remarkDirective, remarkSatuTahu]}
      rehypePlugins={[[rehypeShiki, { theme: "github-dark-default", fallbackLanguage: "text", lazy: true, addLanguageClass: true }]]}
      components={{
        h2: ({ children }) => {
          const id = slugify(textOf(children));
          return (
            <h2 id={id} className="group mt-14 scroll-mt-24 border-t-2 border-dashed border-line pt-10 text-2xl leading-snug font-extrabold tracking-tight first:mt-0 first:border-0 first:pt-0 sm:text-[28px]">
              <a href={`#${id}`} className="no-underline">{children}<span className="ml-2 text-sun-500 opacity-0 transition-opacity group-hover:opacity-100">#</span></a>
            </h2>
          );
        },
        h3: ({ children }) => {
          const id = slugify(textOf(children));
          return <h3 id={id} className="mt-8 scroll-mt-24 text-lg font-extrabold">{children}</h3>;
        },
        p: ({ children }) => <p className="my-4 text-[16.5px] leading-[1.8] text-ink-2">{children}</p>,
        ul: ({ children }) => <ul className="my-4 ml-1 list-none space-y-2 text-[16.5px] leading-[1.75] text-ink-2 [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:top-[0.7em] [&>li]:before:left-1 [&>li]:before:size-2 [&>li]:before:rounded-full [&>li]:before:bg-sun-400 [&>li]:before:ring-2 [&>li]:before:ring-ink [&>li]:before:content-['']">{children}</ul>,
        ol: ({ children }) => <ol className="my-4 ml-6 list-decimal space-y-2 text-[16.5px] leading-[1.75] text-ink-2 marker:font-bold marker:text-ink">{children}</ol>,
        a: ({ href, children }) => {
          const ext = href?.startsWith("http");
          return <a href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-semibold text-ink underline decoration-sun-400 decoration-2 underline-offset-2 hover:bg-sun-100">{children}</a>;
        },
        strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
        blockquote: ({ children }) => <blockquote className="my-6 border-l-4 border-sun-400 pl-5 text-ink-2 italic">{children}</blockquote>,
        hr: () => <hr className="my-10 border-t-2 border-dashed border-line" />,
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-xl border-2 border-ink">
            <table className="w-full min-w-[480px] text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="border-b-2 border-ink bg-sun-100 text-xs tracking-wide uppercase">{children}</thead>,
        th: ({ children }) => <th className="px-4 py-2.5 font-extrabold">{children}</th>,
        td: ({ children }) => <td className="border-t border-line px-4 py-2.5 align-top text-ink-2">{children}</td>,
        code: ({ className, children, ...props }) => {
          const isBlock = /language-|shiki/.test(className ?? "") || (props as { "data-language"?: string })["data-language"];
          if (isBlock) return <code className={className} {...props}>{children}</code>;
          return <code className="rounded-md border border-ink/15 bg-sun-50 px-1.5 py-0.5 font-mono text-[0.88em] text-ink [overflow-wrap:anywhere]">{children}</code>;
        },
        pre: ({ children, ...props }) => {
          const raw = textOf(children);
          const child = (Array.isArray(children) ? children[0] : children) as { props?: { className?: string } } | undefined;
          const lang = (child?.props?.className ?? "").match(/language-(\S+)/)?.[1] ?? "";
          const label = ({ py: "python", python: "python", js: "javascript", ts: "typescript", sh: "terminal", bash: "terminal", text: "teks" } as Record<string, string>)[lang] ?? lang;
          return (
            <div className="group/code relative my-6 overflow-hidden rounded-xl border-2 border-ink shadow-hard-sm">
              <div className="flex items-center justify-between border-b border-paper/10 bg-ink-2 px-4 py-1.5">
                <span className="font-mono text-[11px] tracking-wider text-paper/60 uppercase">{label || "kode"}</span>
                <CopyButton text={raw} />
              </div>
              <pre {...props} className={`${(props as { className?: string }).className ?? ""} overflow-x-auto !bg-ink p-4 font-mono text-[13.5px] leading-relaxed`}>{children}</pre>
            </div>
          );
        },
        // @ts-expect-error elemen kustom dari remarkSatuTahu
        "callout-box": ({ kind, title, children }: { kind: string; title?: string; children: ReactNode }) => {
          if (kind === "solusi") {
            return (
              <details className="group my-6 rounded-xl border-2 border-ink bg-sun-50 p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-extrabold select-none">
                  <span className="flex items-center gap-2"><Eye className="size-4" />{title || "Lihat pembahasan & kunci latihan"}</span>
                  <span className="rounded-md border border-ink/30 bg-paper px-2 py-0.5 text-[11px] font-bold group-open:hidden">Buka</span>
                  <span className="hidden rounded-md border border-ink/30 bg-paper px-2 py-0.5 text-[11px] font-bold group-open:inline">Tutup</span>
                </summary>
                <div className="mt-3 border-t-2 border-dashed border-ink/20 pt-3 text-[15.5px] [&_li]:text-[15.5px] [&_p]:my-2 [&_p]:text-[15.5px] [&_pre]:my-3">{children}</div>
              </details>
            );
          }
          const s = calloutStyle[kind] ?? calloutStyle.info;
          return (
            <aside className={`my-6 rounded-xl border-2 p-4 sm:p-5 ${s.cls}`}>
              <p className="flex items-center gap-2 text-sm font-extrabold"><s.Icon className="size-4" />{title || s.label}</p>
              <div className="text-[15.5px] [&_li]:text-[15.5px] [&_p]:my-2 [&_p]:text-[15.5px] [&_pre]:my-3">{children}</div>
            </aside>
          );
        },
        "viz-block": ({ spec }: { spec: string }) => <Viz spec={spec} />,
      }}
    >
      {source}
    </MarkdownAsync>
  );
}
