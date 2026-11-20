"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pause, Play, RotateCcw, Shuffle, StepForward } from "lucide-react";
import { Btn, Slider, Stat, VizFrame } from "./Frame";

/* ================= BINARY: bit → angka ================= */
export function BinaryViz() {
  const [bits, setBits] = useState([0, 1, 0, 0, 0, 0, 0, 1]);
  const value = bits.reduce((a, b) => a * 2 + b, 0);
  const ch = value >= 32 && value < 127 ? String.fromCharCode(value) : "·";
  return (
    <VizFrame
      title="1 byte = 8 bit"
      hint="Klik bit"
      caption="Setiap bit adalah saklar 0/1 yang bernilai pangkat dua. Klik bit untuk mengubahnya, lalu lihat nilai desimal, heksadesimal, dan karakter ASCII-nya. Nilai awal 01000001 adalah huruf ‘A’."
      controls={<><Btn onClick={() => setBits(Array(8).fill(0))}>Semua 0</Btn><Btn onClick={() => setBits(Array(8).fill(1))}>Semua 1</Btn></>}
    >
      <div className="flex flex-wrap justify-center gap-2">
        {bits.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] text-muted">2^{7 - i}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setBits((bs) => bs.map((x, k) => (k === i ? 1 - x : x)))}
              className={`grid size-11 place-items-center rounded-lg border-2 border-ink font-mono text-xl font-extrabold sm:size-12 ${b ? "bg-sun-400 shadow-hard-sm" : "bg-paper text-ink/40"}`}
            >
              {b}
            </motion.button>
            <span className="font-mono text-[10px] text-ink-3">{b ? 2 ** (7 - i) : 0}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat k="Desimal" v={value} />
        <Stat k="Heksadesimal" v={`0x${value.toString(16).toUpperCase().padStart(2, "0")}`} />
        <Stat k="Karakter ASCII" v={ch} />
      </div>
    </VizFrame>
  );
}

/* ================= BIG-O ================= */
const curves = [
  { id: "O(1)", f: () => 1, c: "#2fb36b" },
  { id: "O(log n)", f: (n: number) => Math.log2(Math.max(n, 1)), c: "#2b4475" },
  { id: "O(n)", f: (n: number) => n, c: "#f5b316" },
  { id: "O(n log n)", f: (n: number) => n * Math.log2(Math.max(n, 1)), c: "#e07a2f" },
  { id: "O(n²)", f: (n: number) => n * n, c: "#d9534f" },
];
export function BigOViz() {
  const [n, setN] = useState(16);
  const W = 520, H = 240, maxN = 64, maxY = 600;
  const path = (f: (x: number) => number) =>
    Array.from({ length: 65 }, (_, x) => `${x === 0 ? "M" : "L"}${(x / maxN) * W},${H - (Math.min(f(x), maxY) / maxY) * H}`).join(" ");
  return (
    <VizFrame
      title="Pertumbuhan jumlah operasi"
      caption="Geser n (ukuran input). Perhatikan bagaimana O(n²) meledak sementara O(log n) hampir datar. Untuk n = 1 juta: log₂ n ≈ 20 langkah, n² = 10¹² langkah."
      controls={<Slider label="Ukuran input n" value={n} min={1} max={64} onChange={setN} />}
    >
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <svg viewBox={`-30 -10 ${W + 40} ${H + 30}`} className="w-full rounded-xl border-2 border-ink bg-paper">
          <line x1={0} y1={H} x2={W} y2={H} stroke="#12203a" strokeWidth={1.5} />
          <line x1={0} y1={0} x2={0} y2={H} stroke="#12203a" strokeWidth={1.5} />
          {curves.map((c) => <path key={c.id} d={path(c.f)} fill="none" stroke={c.c} strokeWidth={3} />)}
          <line x1={(n / maxN) * W} y1={0} x2={(n / maxN) * W} y2={H} stroke="#12203a" strokeDasharray="4 4" />
          <text x={W - 4} y={H + 18} textAnchor="end" fontSize={11} fill="#59647a">n →</text>
          <text x={-6} y={8} textAnchor="end" fontSize={11} fill="#59647a">ops</text>
        </svg>
        <ul className="space-y-1.5">
          {curves.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border-2 border-ink bg-paper px-3 py-1.5 text-sm">
              <span className="flex items-center gap-2 font-mono font-bold"><span className="size-3 rounded-full" style={{ background: c.c }} />{c.id}</span>
              <span className="font-mono">{Math.round(c.f(n)).toLocaleString("id-ID")}</span>
            </li>
          ))}
        </ul>
      </div>
    </VizFrame>
  );
}

/* ================= SORTING ================= */
type Frame = { arr: number[]; hl: number[]; sorted: number[]; note: string };
function genFrames(input: number[], algo: string): Frame[] {
  const a = [...input];
  const out: Frame[] = [];
  const push = (hl: number[], note: string, sorted: number[] = []) => out.push({ arr: [...a], hl, sorted, note });
  if (algo === "bubble") {
    const done: number[] = [];
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a.length - i - 1; j++) {
        push([j, j + 1], `Bandingkan ${a[j]} dan ${a[j + 1]}`, [...done]);
        if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; push([j, j + 1], `Tukar karena ${a[j + 1]} > ${a[j]}`, [...done]); }
      }
      done.push(a.length - i - 1);
    }
  } else if (algo === "selection") {
    const done: number[] = [];
    for (let i = 0; i < a.length; i++) {
      let m = i;
      for (let j = i + 1; j < a.length; j++) { push([m, j], `Cari minimum: bandingkan ${a[m]} dan ${a[j]}`, [...done]); if (a[j] < a[m]) m = j; }
      [a[i], a[m]] = [a[m], a[i]];
      done.push(i);
      push([i], `Letakkan minimum (${a[i]}) di posisi ${i}`, [...done]);
    }
  } else if (algo === "merge") {
    const rec = (l: number, r: number) => {
      if (r - l < 1) return;
      const m = Math.floor((l + r) / 2);
      rec(l, m); rec(m + 1, r);
      const left = a.slice(l, m + 1), right = a.slice(m + 1, r + 1);
      let i = 0, j = 0, k = l;
      while (i < left.length || j < right.length) {
        if (j >= right.length || (i < left.length && left[i] <= right[j])) a[k++] = left[i++];
        else a[k++] = right[j++];
        push([k - 1], `Gabungkan bagian [${l}..${r}]`);
      }
    };
    rec(0, a.length - 1);
  } else {
    const rec = (l: number, r: number) => {
      if (l >= r) return;
      const p = a[r];
      let i = l;
      for (let j = l; j < r; j++) {
        push([j, r], `Pivot ${p}: bandingkan ${a[j]}`);
        if (a[j] < p) { [a[i], a[j]] = [a[j], a[i]]; i++; }
      }
      [a[i], a[r]] = [a[r], a[i]];
      push([i], `Pivot ${p} sampai di posisi akhirnya`);
      rec(l, i - 1); rec(i + 1, r);
    };
    rec(0, a.length - 1);
  }
  out.push({ arr: [...a], hl: [], sorted: a.map((_, i) => i), note: `Selesai dalam ${out.length} langkah` });
  return out;
}
const rand = () => Array.from({ length: 10 }, () => 5 + Math.floor(Math.random() * 45));
export function SortingViz({ algo: initial = "bubble" }: { algo?: string }) {
  const [data, setData] = useState([29, 10, 14, 37, 13, 5, 41, 22, 18, 33]);
  const [algo, setAlgo] = useState(initial);
  const frames = useMemo(() => genFrames(data, algo), [data, algo]);
  const [f, setF] = useState(0);
  const [play, setPlay] = useState(false);
  useEffect(() => { setF(0); setPlay(false); }, [frames]);
  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setF((v) => { if (v >= frames.length - 1) { setPlay(false); return v; } return v + 1; }), 160);
    return () => clearInterval(id);
  }, [play, frames.length]);
  const fr = frames[f];
  return (
    <VizFrame
      title="Visualisasi algoritma sorting"
      caption="Bandingkan jumlah langkah tiap algoritma pada data yang sama. Bubble & selection sort O(n²); merge & quick sort rata-rata O(n log n)."
      controls={
        <>
          {[["bubble", "Bubble"], ["selection", "Selection"], ["merge", "Merge"], ["quick", "Quick"]].map(([k, l]) => <Btn key={k} active={algo === k} onClick={() => setAlgo(k)}>{l}</Btn>)}
          <span className="mx-1 h-5 w-px bg-ink/20" />
          <Btn onClick={() => setPlay((p) => !p)}>{play ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{play ? "Jeda" : "Putar"}</Btn>
          <Btn title="Langkah berikutnya" onClick={() => setF((v) => Math.min(v + 1, frames.length - 1))}><StepForward className="size-3.5" /></Btn>
          <Btn onClick={() => setData(rand())}><Shuffle className="size-3.5" />Acak</Btn>
        </>
      }
    >
      <div className="flex h-48 items-end justify-center gap-1.5 rounded-xl border-2 border-ink bg-paper p-3">
        {fr.arr.map((v, i) => (
          <motion.div key={i} layout className={`flex w-full max-w-10 items-end justify-center rounded-t-md border-2 border-ink pb-1 font-mono text-[10px] font-bold ${fr.sorted.includes(i) ? "bg-[#4fd27a]" : fr.hl.includes(i) ? "bg-sun-400" : "bg-sun-100"}`} style={{ height: `${(v / 50) * 100}%` }}>
            {v}
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <p className="font-semibold">{fr.note}</p>
        <span className="shrink-0 font-mono text-xs text-muted">langkah {f + 1}/{frames.length}</span>
      </div>
    </VizFrame>
  );
}

/* ================= BINARY SEARCH ================= */
export function BinarySearchViz() {
  const arr = [3, 7, 11, 15, 19, 23, 28, 31, 36, 42, 47, 53, 58, 64, 71, 77];
  const [target, setTarget] = useState(47);
  const [st, setSt] = useState({ lo: 0, hi: arr.length - 1, mid: -1, found: -1, steps: 0, done: false });
  const reset = () => setSt({ lo: 0, hi: arr.length - 1, mid: -1, found: -1, steps: 0, done: false });
  useEffect(reset, [target]);
  const step = () =>
    setSt((s) => {
      if (s.done) return s;
      if (s.lo > s.hi) return { ...s, done: true };
      const mid = Math.floor((s.lo + s.hi) / 2);
      if (arr[mid] === target) return { ...s, mid, found: mid, steps: s.steps + 1, done: true };
      return arr[mid] < target ? { ...s, mid, lo: mid + 1, steps: s.steps + 1 } : { ...s, mid, hi: mid - 1, steps: s.steps + 1 };
    });
  return (
    <VizFrame
      title="Binary search: membuang separuh setiap langkah"
      caption={`Data harus terurut. Pada ${arr.length} elemen, binary search butuh paling banyak ${Math.ceil(Math.log2(arr.length + 1))} langkah, sedangkan pencarian linear bisa sampai ${arr.length} langkah.`}
      controls={
        <>
          <label className="flex items-center gap-2 text-xs font-bold">Cari:
            <select value={target} onChange={(e) => setTarget(Number(e.target.value))} className="rounded-lg border-2 border-ink bg-paper px-2 py-1 font-mono">
              {[...arr, 50].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <Btn onClick={step} disabled={st.done}><StepForward className="size-3.5" />Langkah</Btn>
          <Btn onClick={reset}><RotateCcw className="size-3.5" />Ulang</Btn>
        </>
      }
    >
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-16">
        {arr.map((v, i) => {
          const out = i < st.lo || i > st.hi;
          return (
            <div key={i} className={`flex flex-col items-center rounded-lg border-2 py-1.5 font-mono text-sm font-bold transition-all ${i === st.found ? "border-ink bg-[#4fd27a]" : i === st.mid ? "border-ink bg-sun-400" : out ? "border-ink/15 bg-cream text-ink/25" : "border-ink bg-paper"}`}>
              {v}
              <span className="text-[9px] font-normal text-muted">{i === st.lo && !out ? "lo" : ""}{i === st.hi && !out ? " hi" : ""}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm font-semibold">
        {st.steps === 0 ? "Tekan ‘Langkah’ untuk mulai." : st.found >= 0 ? `Ketemu di indeks ${st.found} setelah ${st.steps} langkah.` : st.done ? `Tidak ditemukan (${st.steps} langkah).` : `Langkah ${st.steps}: tengah = ${arr[st.mid]} ${arr[st.mid] < target ? "< target → buang kiri" : "> target → buang kanan"}.`}
      </p>
    </VizFrame>
  );
}

/* ================= STACK & QUEUE ================= */
export function StackQueueViz() {
  const [stack, setStack] = useState<number[]>([1, 2, 3]);
  const [queue, setQueue] = useState<number[]>([1, 2, 3]);
  const [n, setN] = useState(4);
  const [msg, setMsg] = useState("");
  return (
    <VizFrame
      title="Stack (LIFO) vs Queue (FIFO)"
      caption="Stack seperti tumpukan piring: yang terakhir masuk keluar pertama (undo, call stack). Queue seperti antrean kasir: yang pertama datang dilayani pertama (antrean print, task queue)."
      controls={
        <>
          <Btn onClick={() => { setStack((s) => [...s, n]); setQueue((q) => [...q, n]); setN(n + 1); setMsg(`push/enqueue ${n}`); }}>Tambah {n}</Btn>
          <Btn onClick={() => { const s = stack.at(-1); const q = queue[0]; setStack((x) => x.slice(0, -1)); setQueue((x) => x.slice(1)); setMsg(`stack.pop() → ${s ?? "kosong"}, queue.dequeue() → ${q ?? "kosong"}`); }}>Ambil</Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-wider text-muted uppercase">Stack: keluar dari atas</p>
          <div className="flex h-56 flex-col-reverse items-center gap-1 rounded-xl border-2 border-t-0 border-ink bg-paper p-2">
            <AnimatePresence>
              {stack.map((v, i) => (
                <motion.div key={`${v}-${i}`} initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className={`w-3/4 rounded-md border-2 border-ink py-1.5 text-center font-mono text-sm font-bold ${i === stack.length - 1 ? "bg-sun-400" : "bg-sun-100"}`}>{v}</motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-wider text-muted uppercase">Queue: masuk belakang, keluar depan</p>
          <div className="flex h-14 items-center gap-1 overflow-hidden rounded-xl border-2 border-x-0 border-ink bg-paper px-2">
            <span className="text-[10px] font-bold text-muted">depan</span>
            <AnimatePresence>
              {queue.map((v, i) => (
                <motion.div key={`${v}-q`} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className={`grid size-9 shrink-0 place-items-center rounded-md border-2 border-ink font-mono text-sm font-bold ${i === 0 ? "bg-sun-400" : "bg-sun-100"}`}>{v}</motion.div>
              ))}
            </AnimatePresence>
          </div>
          <p className="mt-4 rounded-lg border-2 border-ink bg-ink p-3 font-mono text-xs text-sun-300">{msg || "Klik tombol untuk menambah atau mengambil."}</p>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= HASH TABLE ================= */
function simpleHash(s: string, m: number) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % m;
  return h;
}
export function HashTableViz() {
  const M = 7;
  const [keys, setKeys] = useState(["apel", "jeruk", "mangga"]);
  const [input, setInput] = useState("");
  const buckets = Array.from({ length: M }, (_, b) => keys.filter((k) => simpleHash(k, M) === b));
  const add = () => { const k = input.trim().toLowerCase(); if (k && !keys.includes(k)) setKeys([...keys, k]); setInput(""); };
  return (
    <VizFrame
      title="Hash table dengan chaining"
      hint="Tambah kunci"
      caption="Fungsi hash mengubah kunci menjadi nomor bucket. Akses rata-rata O(1). Jika dua kunci jatuh ke bucket yang sama (collision), keduanya disimpan berantai; semakin penuh tabel, semakin panjang rantainya."
      controls={
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex flex-wrap items-center gap-2">
          <input aria-label="Kunci hash table" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ketik kunci, mis. pisang" className="w-44 rounded-lg border-2 border-ink bg-paper px-2 py-1 text-sm" />
          <Btn onClick={add}>Masukkan</Btn>
          {input && <span className="font-mono text-xs">hash(“{input}”) % {M} = <b>{simpleHash(input.trim().toLowerCase(), M)}</b></span>}
          <Btn onClick={() => setKeys([])}>Kosongkan</Btn>
        </form>
      }
    >
      <div className="space-y-1.5">
        {buckets.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border-2 border-ink bg-ink font-mono text-sm font-bold text-sun-300">{i}</span>
            <div className="flex min-h-9 flex-1 flex-wrap items-center gap-1.5 rounded-md border-2 border-dashed border-ink/30 bg-paper px-2 py-1">
              {b.map((k, j) => (
                <motion.span key={k} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                  {j > 0 && <span className="text-xs text-muted">→</span>}
                  <span className={`rounded-md border-2 border-ink px-2 py-0.5 font-mono text-xs font-bold ${b.length > 1 ? "bg-[#ffd9cf]" : "bg-sun-200"}`}>{k}</span>
                </motion.span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Load factor: {keys.length}/{M} = {(keys.length / M).toFixed(2)} · Collision: {buckets.filter((b) => b.length > 1).length} bucket</p>
    </VizFrame>
  );
}

/* ================= BST ================= */
type BNode = { v: number; l?: BNode; r?: BNode };
function insert(n: BNode | undefined, v: number): BNode {
  if (!n) return { v };
  if (v < n.v) return { ...n, l: insert(n.l, v) };
  if (v > n.v) return { ...n, r: insert(n.r, v) };
  return n;
}
function layout(n: BNode | undefined, depth: number, x0: number, x1: number, out: { v: number; x: number; y: number; px?: number; py?: number }[], px?: number, py?: number) {
  if (!n) return;
  const x = (x0 + x1) / 2, y = 30 + depth * 58;
  out.push({ v: n.v, x, y, px, py });
  layout(n.l, depth + 1, x0, x, out, x, y);
  layout(n.r, depth + 1, x, x1, out, x, y);
}
export function BstViz() {
  const [vals, setVals] = useState([50, 30, 70, 20, 40, 60, 80]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState<number | null>(null);
  const root = vals.reduce<BNode | undefined>((r, v) => insert(r, v), undefined);
  const nodes: { v: number; x: number; y: number; px?: number; py?: number }[] = [];
  layout(root, 0, 0, 600, nodes);
  const path: number[] = [];
  if (search !== null) { let c = root; while (c) { path.push(c.v); if (search === c.v) break; c = search < c.v ? c.l : c.r; } }
  const depth = Math.max(...nodes.map((n) => n.y), 30);
  return (
    <VizFrame
      title="Binary search tree"
      caption="Kiri selalu lebih kecil, kanan lebih besar. Pencarian mengikuti satu jalur dari akar, sehingga butuh O(log n) pada pohon seimbang. Coba masukkan angka berurutan (10, 20, 30, …) untuk melihat pohon miring yang lambat, O(n)."
      controls={
        <form onSubmit={(e) => { e.preventDefault(); const v = Number(input); if (!Number.isNaN(v) && input) setVals([...vals, v]); setInput(""); }} className="flex flex-wrap items-center gap-2">
          <input aria-label="Angka untuk disisipkan atau dicari" value={input} onChange={(e) => setInput(e.target.value)} type="number" placeholder="angka" className="w-24 rounded-lg border-2 border-ink bg-paper px-2 py-1 text-sm" />
          <Btn onClick={() => { const v = Number(input); if (input) setVals([...vals, v]); setInput(""); }}>Sisipkan</Btn>
          <Btn onClick={() => { const v = Number(input); if (input) setSearch(v); }}>Cari</Btn>
          <Btn onClick={() => { setVals([10, 20, 30, 40, 50]); setSearch(null); }}>Data berurutan</Btn>
          <Btn title="Ulang dari awal" onClick={() => { setVals([50, 30, 70, 20, 40, 60, 80]); setSearch(null); }}><RotateCcw className="size-3.5" /></Btn>
        </form>
      }
    >
      <svg viewBox={`0 0 600 ${depth + 30}`} className="w-full rounded-xl border-2 border-ink bg-paper">
        {nodes.map((n, i) => n.px !== undefined && <line key={`l${i}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y} stroke="#12203a" strokeWidth={2} />)}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={19} fill={path.at(-1) === n.v && search === n.v ? "#4fd27a" : path.includes(n.v) ? "#fec536" : "#fff"} stroke="#12203a" strokeWidth={2.5} />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily="monospace" fill="#12203a">{n.v}</text>
          </g>
        ))}
      </svg>
      {search !== null && <p className="mt-2 text-sm font-semibold">Jalur pencarian {search}: {path.join(" → ")} {path.at(-1) === search ? "✓ ketemu" : "✗ tidak ada"} ({path.length} perbandingan)</p>}
    </VizFrame>
  );
}

/* ================= RECURSION (fibonacci + memo) ================= */
export function RecursionViz() {
  const [n, setN] = useState(6);
  const [memo, setMemo] = useState(false);
  const calls = useMemo(() => {
    let count = 0;
    const cache = new Map<number, number>();
    const fib = (k: number): number => {
      count++;
      if (memo && cache.has(k)) return cache.get(k)!;
      const r = k < 2 ? k : fib(k - 1) + fib(k - 2);
      if (memo) cache.set(k, r);
      return r;
    };
    const result = fib(n);
    return { count, result };
  }, [n, memo]);
  const tree = (k: number, d: number): BNode | undefined => (d > 4 ? undefined : { v: k, l: k >= 2 ? tree(k - 1, d + 1) : undefined, r: k >= 2 ? tree(k - 2, d + 1) : undefined });
  const nodes: { v: number; x: number; y: number; px?: number; py?: number }[] = [];
  layout(tree(Math.min(n, 6), 0), 0, 0, 640, nodes);
  const seen = new Set<number>();
  return (
    <VizFrame
      title="Rekursi fib(n) & memoization"
      caption="Tanpa memo, fib(n) menghitung ulang sub-masalah yang sama berkali-kali (pohon panggilan tumbuh eksponensial). Dengan memo, setiap fib(k) cukup dihitung sekali; inilah ide dasar dynamic programming."
      controls={<><Slider label="n" value={n} min={2} max={25} onChange={setN} /><Btn active={memo} onClick={() => setMemo((m) => !m)}>Memo: {memo ? "ON" : "OFF"}</Btn></>}
    >
      <div className="grid grid-cols-2 gap-2">
        <Stat k={`fib(${n})`} v={calls.result.toLocaleString("id-ID")} />
        <Stat k="Jumlah panggilan fungsi" v={calls.count.toLocaleString("id-ID")} tone={memo ? "good" : calls.count > 1000 ? "bad" : "warn"} />
      </div>
      <p className="mt-3 text-xs text-muted">Pohon panggilan (dipotong pada kedalaman 5). Node berwarna = dihitung ulang tanpa memo.</p>
      <svg viewBox={`0 0 640 ${Math.max(...nodes.map((x) => x.y)) + 30}`} className="mt-1 w-full rounded-xl border-2 border-ink bg-paper">
        {nodes.map((x, i) => x.px !== undefined && <line key={`l${i}`} x1={x.px} y1={x.py} x2={x.x} y2={x.y} stroke="#12203a" strokeWidth={1.5} />)}
        {nodes.map((x, i) => {
          const dup = seen.has(x.v); seen.add(x.v);
          return (
            <g key={i}>
              <circle cx={x.x} cy={x.y} r={14} fill={dup ? (memo ? "#dff5e7" : "#ffd9cf") : "#fff"} stroke="#12203a" strokeWidth={2} />
              <text x={x.x} y={x.y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="monospace">{x.v}</text>
            </g>
          );
        })}
      </svg>
    </VizFrame>
  );
}

/* ================= GRAPH BFS/DFS di grid ================= */
export function GraphSearchViz() {
  const R = 8, C = 12;
  const walls = useMemo(() => new Set(["1,3", "2,3", "3,3", "4,3", "5,3", "3,6", "3,7", "3,8", "4,8", "5,8", "6,8", "0,8", "1,8", "6,5", "6,6"]), []);
  const start = "6,1", goal = "1,10";
  const [algo, setAlgo] = useState<"bfs" | "dfs">("bfs");
  const [k, setK] = useState(0);
  const order = useMemo(() => {
    const seen = new Set([start]);
    const prev = new Map<string, string>();
    const frontier = [start];
    const visited: string[] = [];
    while (frontier.length) {
      const cur = algo === "bfs" ? frontier.shift()! : frontier.pop()!;
      visited.push(cur);
      if (cur === goal) break;
      const [r, c] = cur.split(",").map(Number);
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nr = r + dr, nc = c + dc, key = `${nr},${nc}`;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C || walls.has(key) || seen.has(key)) continue;
        seen.add(key); prev.set(key, cur); frontier.push(key);
      }
    }
    const path: string[] = [];
    let p: string | undefined = goal;
    while (p && prev.has(p)) { path.push(p); p = prev.get(p); }
    return { visited, path };
  }, [algo, walls]);
  useEffect(() => setK(0), [algo]);
  useEffect(() => {
    if (k >= order.visited.length) return;
    const id = setTimeout(() => setK(k + 1), 45);
    return () => clearTimeout(id);
  }, [k, order.visited.length]);
  const vis = new Set(order.visited.slice(0, k));
  const done = k >= order.visited.length;
  return (
    <VizFrame
      title="Penelusuran graph: BFS vs DFS"
      caption="Setiap sel adalah simpul, tetangga adalah sel atas/bawah/kiri/kanan. BFS menyebar merata seperti riak air dan menjamin jalur terpendek; DFS menyelam sejauh mungkin dulu sehingga jalurnya belum tentu terpendek."
      controls={<><Btn active={algo === "bfs"} onClick={() => setAlgo("bfs")}>BFS (queue)</Btn><Btn active={algo === "dfs"} onClick={() => setAlgo("dfs")}>DFS (stack)</Btn><Btn onClick={() => setK(0)}><RotateCcw className="size-3.5" />Ulang</Btn></>}
    >
      <div className="mx-auto grid max-w-lg gap-1" style={{ gridTemplateColumns: `repeat(${C}, 1fr)` }}>
        {Array.from({ length: R * C }, (_, i) => {
          const key = `${Math.floor(i / C)},${i % C}`;
          const cls = key === start ? "bg-ink" : key === goal ? "bg-[#d9534f]" : walls.has(key) ? "bg-ink/70" : done && order.path.includes(key) ? "bg-[#4fd27a]" : vis.has(key) ? "bg-sun-300" : "bg-paper";
          return <div key={key} className={`aspect-square rounded-[4px] border border-ink/30 transition-colors ${cls}`} />;
        })}
      </div>
      <p className="mt-3 text-center text-sm font-semibold">{done ? `Dikunjungi ${order.visited.length} sel · panjang jalur ${order.path.length}` : "Menelusuri…"}</p>
    </VizFrame>
  );
}

/* ================= CPU SCHEDULER (round robin) ================= */
export function SchedulerViz() {
  const procs = [{ id: "P1", burst: 5, c: "#fec536" }, { id: "P2", burst: 3, c: "#9cc3ff" }, { id: "P3", burst: 6, c: "#ffb4a2" }, { id: "P4", burst: 2, c: "#a7e3bd" }];
  const [q, setQ] = useState(2);
  const timeline = useMemo(() => {
    const rem = procs.map((p) => p.burst);
    const out: { id: string; c: string; t0: number; t1: number }[] = [];
    let t = 0;
    const finish: Record<string, number> = {};
    while (rem.some((r) => r > 0)) {
      procs.forEach((p, i) => {
        if (rem[i] <= 0) return;
        const run = Math.min(q, rem[i]);
        out.push({ id: p.id, c: p.c, t0: t, t1: t + run });
        t += run; rem[i] -= run;
        if (rem[i] === 0) finish[p.id] = t;
      });
    }
    const avgWait = procs.reduce((a, p) => a + (finish[p.id] - p.burst), 0) / procs.length;
    return { out, total: t, avgWait, switches: out.length - 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  return (
    <VizFrame
      title="Penjadwalan CPU round-robin"
      caption="OS bergiliran memberi setiap proses jatah waktu (quantum). Quantum kecil = responsif tapi banyak context switch (overhead); quantum besar = mirip first-come-first-served."
      controls={<Slider label="Quantum (satuan waktu)" value={q} min={1} max={6} onChange={setQ} />}
    >
      <div className="flex h-12 overflow-hidden rounded-xl border-2 border-ink">
        {timeline.out.map((s, i) => (
          <motion.div key={`${q}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="grid place-items-center border-r-2 border-ink font-mono text-xs font-bold last:border-r-0" style={{ width: `${((s.t1 - s.t0) / timeline.total) * 100}%`, background: s.c }}>{s.id}</motion.div>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted"><span>0</span><span>{timeline.total}</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat k="Context switch" v={timeline.switches} />
        <Stat k="Rata-rata waktu tunggu" v={timeline.avgWait.toFixed(2)} />
        <Stat k="Burst" v={procs.map((p) => `${p.id}=${p.burst}`).join(" ")} />
      </div>
    </VizFrame>
  );
}

/* ================= LINKED LIST ================= */
export function LinkedListViz() {
  const [list, setList] = useState(["A", "B", "C"]);
  const [next, setNext] = useState(68);
  const [pos, setPos] = useState(1);
  const ref = useRef(0);
  ref.current = list.length;
  return (
    <VizFrame
      title="Linked list: node + pointer"
      caption="Setiap node menyimpan nilai dan alamat node berikutnya. Menyisipkan di tengah cukup mengubah dua pointer (O(1) jika posisinya sudah diketahui), tapi mencari elemen ke-k harus berjalan dari head, O(n). Bandingkan dengan array yang aksesnya O(1) tetapi penyisipannya menggeser elemen."
      controls={
        <>
          <Slider label="Posisi sisip" value={Math.min(pos, list.length)} min={0} max={list.length} onChange={setPos} />
          <Btn onClick={() => { const c = String.fromCharCode(next); setList((l) => [...l.slice(0, pos), c, ...l.slice(pos)]); setNext(next + 1); }}>Sisipkan {String.fromCharCode(next)}</Btn>
          <Btn onClick={() => setList((l) => l.filter((_, i) => i !== Math.min(pos, l.length - 1)))}>Hapus di posisi</Btn>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="rounded-md bg-ink px-2 py-1 font-mono text-xs font-bold text-sun-300">head</span>
        <span>→</span>
        <AnimatePresence>
          {list.map((v, i) => (
            <motion.div key={v} layout initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6 }} className="flex items-center gap-1">
              <div className={`flex overflow-hidden rounded-lg border-2 border-ink ${i === pos ? "shadow-hard-sm" : ""}`}>
                <span className={`px-3 py-1.5 font-mono font-bold ${i === pos ? "bg-sun-400" : "bg-sun-100"}`}>{v}</span>
                <span className="border-l-2 border-ink bg-paper px-2 py-1.5 font-mono text-[10px] text-muted">next</span>
              </div>
              <span>→</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <span className="font-mono text-xs text-muted">null</span>
      </div>
    </VizFrame>
  );
}
