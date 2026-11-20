"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronRight, Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { Btn, VizFrame } from "./Frame";

type Step = { label: string; detail: string };

/* ---------- FLOW: langkah berurutan ---------- */
export function FlowViz({ title, caption, steps, loop }: { title: string; caption?: string; steps: Step[]; loop?: boolean }) {
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setI((v) => (v + 1 >= steps.length ? (loop ? 0 : v) : v + 1)), 2200);
    return () => clearInterval(id);
  }, [play, steps.length, loop]);
  return (
    <VizFrame
      title={title}
      caption={caption}
      controls={
        <>
          <Btn onClick={() => setPlay((p) => !p)} active={play}>{play ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{play ? "Jeda" : "Putar"}</Btn>
          <Btn onClick={() => setI((v) => Math.min(v + 1, steps.length - 1))}><StepForward className="size-3.5" />Langkah</Btn>
          <Btn onClick={() => { setI(0); setPlay(false); }}><RotateCcw className="size-3.5" />Ulang</Btn>
        </>
      }
    >
      <ol className="flex flex-wrap items-stretch gap-2">
        {steps.map((s, k) => (
          <li key={s.label} className="flex items-center gap-2">
            <button
              onClick={() => { setI(k); setPlay(false); }}
              className={`rounded-xl border-2 border-ink px-3 py-2 text-left text-sm font-bold transition-all ${k === i ? "bg-sun-400 shadow-hard-sm -translate-y-0.5" : k < i ? "bg-sun-100" : "bg-paper"}`}
            >
              <span className="mr-1.5 font-mono text-xs text-ink-3">{k + 1}.</span>{s.label}
            </button>
            {(k < steps.length - 1 || loop) && <ChevronRight className={`size-4 shrink-0 ${k < i ? "text-ink" : "text-ink/25"}`} />}
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-xl border-2 border-ink bg-paper p-4">
          <p className="font-mono text-[11px] font-bold text-ink-3">LANGKAH {i + 1}/{steps.length}</p>
          <p className="mt-0.5 font-extrabold">{steps[i].label}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{steps[i].detail}</p>
        </motion.div>
      </AnimatePresence>
    </VizFrame>
  );
}

/* ---------- SEQUENCE: pesan antar aktor ---------- */
type Msg = { from: number; to: number; label: string; note?: string };
export function SequenceViz({ title, caption, actors, messages }: { title: string; caption?: string; actors: string[]; messages: Msg[] }) {
  const [n, setN] = useState(1);
  const colW = 100 / actors.length;
  const cx = (a: number) => colW * a + colW / 2;
  const cur = messages[n - 1];
  return (
    <VizFrame
      title={title}
      caption={caption}
      controls={
        <>
          <Btn onClick={() => setN((v) => Math.min(v + 1, messages.length))} disabled={n >= messages.length}><StepForward className="size-3.5" />Pesan berikutnya</Btn>
          <Btn onClick={() => setN(messages.length)}>Tampilkan semua</Btn>
          <Btn onClick={() => setN(1)}><RotateCcw className="size-3.5" />Ulang</Btn>
          <span className="ml-auto font-mono text-xs text-muted">{n}/{messages.length}</span>
        </>
      }
    >
      <div className="overflow-x-auto">
        <div className="relative min-w-[460px]">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${actors.length}, 1fr)` }}>
            {actors.map((a) => (
              <div key={a} className="flex justify-center"><span className="rounded-lg border-2 border-ink bg-sun-300 px-3 py-1.5 text-center text-xs font-extrabold sm:text-sm">{a}</span></div>
            ))}
          </div>
          <div className="relative mt-2" style={{ height: messages.length * 44 + 16 }}>
            {actors.map((a, k) => (
              <div key={a} className="absolute top-0 bottom-0 w-0 border-l-2 border-dashed border-ink/30" style={{ left: `${cx(k)}%` }} />
            ))}
            {messages.slice(0, n).map((m, k) => {
              const l = Math.min(cx(m.from), cx(m.to));
              const w = Math.abs(cx(m.to) - cx(m.from));
              const right = m.to > m.from;
              const self = m.from === m.to;
              return (
                <motion.div key={k} initial={{ opacity: 0, x: right ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="absolute" style={{ top: k * 44 + 8, left: `${self ? cx(m.from) : l}%`, width: self ? "18%" : `${w}%` }}>
                  <p className={`truncate px-1 text-center text-[11.5px] font-bold ${k === n - 1 ? "text-ink" : "text-muted"}`}>{m.label}</p>
                  <div className={`relative h-0.5 ${k === n - 1 ? "bg-ink" : "bg-ink/40"}`}>
                    <span className={`absolute -top-[5px] size-0 border-y-[6px] border-y-transparent ${right || self ? "right-0 border-l-[8px] border-l-ink" : "left-0 border-r-[8px] border-r-ink"}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      {cur?.note && (
        <motion.p key={n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 rounded-xl border-2 border-ink bg-paper p-3 text-sm leading-relaxed">
          <span className="font-bold">{n}. {cur.label}: </span>{cur.note}
        </motion.p>
      )}
    </VizFrame>
  );
}

/* ---------- LAYERS: tumpukan lapisan ---------- */
export function LayersViz({ title, caption, layers }: { title: string; caption?: string; layers: { label: string; detail: string; tag?: string }[] }) {
  const [i, setI] = useState(0);
  const tints = ["bg-sun-400", "bg-sun-300", "bg-sun-200", "bg-sun-100", "bg-sun-50", "bg-paper", "bg-cream"];
  return (
    <VizFrame title={title} caption={caption} hint="Klik lapisan">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-1.5">
          {layers.map((l, k) => (
            <motion.button
              key={l.label}
              onClick={() => setI(k)}
              animate={{ x: k === i ? 8 : 0 }}
              className={`flex items-center justify-between rounded-lg border-2 border-ink px-3 py-2.5 text-left text-sm font-bold ${tints[k % tints.length]} ${k === i ? "shadow-hard-sm" : ""}`}
              style={{ marginLeft: `${k * 1.2}%`, marginRight: `${k * 1.2}%` }}
            >
              {l.label}
              {l.tag && <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[10px] text-sun-300">{l.tag}</span>}
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="rounded-xl border-2 border-ink bg-paper p-4">
            <p className="font-mono text-[11px] font-bold text-ink-3">LAPISAN {i + 1}{layers[i].tag ? ` · ${layers[i].tag}` : ""}</p>
            <p className="mt-1 text-lg font-extrabold">{layers[i].label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{layers[i].detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </VizFrame>
  );
}

/* ---------- COMPARE: perbandingan ---------- */
export function CompareViz({ title, caption, columns, rows }: { title: string; caption?: string; columns: string[]; rows: { label: string; values: string[] }[] }) {
  const [hi, setHi] = useState<number | null>(null);
  return (
    <VizFrame title={title} caption={caption} hint="Arahkan ke kolom">
      <div className="overflow-x-auto rounded-xl border-2 border-ink bg-paper">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="bg-cream px-3 py-2.5 text-xs text-muted uppercase">Aspek</th>
              {columns.map((c, k) => (
                <th key={c} onMouseEnter={() => setHi(k)} onMouseLeave={() => setHi(null)} className={`px-3 py-2.5 font-extrabold transition-colors ${hi === k ? "bg-sun-400" : "bg-sun-100"}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <td className="bg-cream/60 px-3 py-2.5 font-bold">{r.label}</td>
                {r.values.map((v, k) => (
                  <td key={k} onMouseEnter={() => setHi(k)} onMouseLeave={() => setHi(null)} className={`px-3 py-2.5 text-ink-2 transition-colors ${hi === k ? "bg-sun-50" : ""}`}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VizFrame>
  );
}

/* ---------- TREE: hierarki ---------- */
type TNode = { label: string; detail?: string; children?: TNode[] };
function TreeItem({ n, depth, sel, setSel }: { n: TNode; depth: number; sel: TNode | null; setSel: (n: TNode) => void }) {
  const [open, setOpen] = useState(depth < 2);
  const has = !!n.children?.length;
  return (
    <li>
      <div className="flex items-center gap-1">
        {has ? (
          <button onClick={() => setOpen((o) => !o)} className="grid size-5 place-items-center rounded border border-ink/30 bg-paper" aria-label={open ? "Tutup" : "Buka"}>
            {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : <span className="size-5" />}
        <button onClick={() => setSel(n)} className={`rounded-md border-2 px-2 py-0.5 font-mono text-[13px] font-semibold transition-colors ${sel === n ? "border-ink bg-sun-400" : "border-transparent hover:border-ink/30 hover:bg-sun-50"}`}>{n.label}</button>
      </div>
      {has && open && (
        <ul className="ml-[9px] border-l-2 border-ink/20 pl-4">
          {n.children!.map((c, k) => <TreeItem key={c.label + k} n={c} depth={depth + 1} sel={sel} setSel={setSel} />)}
        </ul>
      )}
    </li>
  );
}
export function TreeViz({ title, caption, root }: { title: string; caption?: string; root: TNode }) {
  const [sel, setSel] = useState<TNode | null>(root);
  return (
    <VizFrame title={title} caption={caption} hint="Klik node">
      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <ul className="space-y-1 rounded-xl border-2 border-ink bg-paper p-3"><TreeItem n={root} depth={0} sel={sel} setSel={setSel} /></ul>
        <div className="rounded-xl border-2 border-ink bg-paper p-4">
          <p className="font-mono text-sm font-extrabold">{sel?.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{sel?.detail ?? "Klik node lain untuk melihat penjelasannya."}</p>
        </div>
      </div>
    </VizFrame>
  );
}

/* ---------- FSM: state machine ---------- */
export function FsmViz({ title, caption, states, start, transitions }: { title: string; caption?: string; states: { id: string; detail: string }[]; start: string; transitions: { from: string; to: string; event: string }[] }) {
  const [cur, setCur] = useState(start);
  const [log, setLog] = useState<string[]>([]);
  const avail = transitions.filter((t) => t.from === cur);
  const info = states.find((s) => s.id === cur);
  return (
    <VizFrame
      title={title}
      caption={caption}
      hint="Picu event"
      controls={
        <>
          <span className="text-xs font-bold text-muted">Event tersedia:</span>
          {avail.length === 0 && <span className="text-xs text-muted">tidak ada (state akhir)</span>}
          {avail.map((t) => (
            <Btn key={t.event + t.to} onClick={() => { setCur(t.to); setLog((l) => [...l.slice(-5), `${t.from} —${t.event}→ ${t.to}`]); }}>{t.event}</Btn>
          ))}
          <Btn onClick={() => { setCur(start); setLog([]); }}><RotateCcw className="size-3.5" />Reset</Btn>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {states.map((s) => (
          <motion.span key={s.id} animate={{ scale: s.id === cur ? 1.08 : 1 }} className={`rounded-full border-2 border-ink px-3 py-1.5 font-mono text-sm font-bold ${s.id === cur ? "bg-sun-400 shadow-hard-sm" : "bg-paper text-muted"}`}>{s.id}</motion.span>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border-2 border-ink bg-paper p-4">
          <p className="font-mono text-[11px] font-bold text-ink-3">STATE SAAT INI</p>
          <p className="font-mono text-lg font-extrabold">{cur}</p>
          <p className="mt-1 text-sm text-muted">{info?.detail}</p>
        </div>
        <div className="rounded-xl border-2 border-ink bg-ink p-4 font-mono text-xs text-paper/80">
          <p className="mb-1 text-sun-300">riwayat transisi</p>
          {log.length === 0 ? <p className="text-paper/40">belum ada</p> : log.map((l, k) => <p key={k}>{l}</p>)}
        </div>
      </div>
    </VizFrame>
  );
}
