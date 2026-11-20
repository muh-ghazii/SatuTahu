"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Btn, Slider, Stat, VizFrame } from "./Frame";

/* ================= FUNGSI AKTIVASI ================= */
const acts: Record<string, { f: (x: number) => number; d: string }> = {
  ReLU: { f: (x) => Math.max(0, x), d: "max(0, x). Murah dihitung dan default untuk hidden layer. Neuron bisa ‘mati’ jika selalu negatif." },
  Sigmoid: { f: (x) => 1 / (1 + Math.exp(-x)), d: "Memetakan ke (0, 1), cocok untuk output probabilitas biner. Gradien hampir nol di ujung (vanishing gradient)." },
  Tanh: { f: (x) => Math.tanh(x), d: "Memetakan ke (−1, 1) dan berpusat di nol. Masih mengalami vanishing gradient." },
  GELU: { f: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))), d: "Versi ReLU yang halus; dipakai di Transformer seperti GPT dan BERT." },
};
export function ActivationViz() {
  const [name, setName] = useState("ReLU");
  const [x, setX] = useState(1);
  const a = acts[name];
  const X = (v: number) => ((v + 5) / 10) * 300, Y = (v: number) => 110 - v * 45;
  return (
    <VizFrame
      title="Fungsi aktivasi"
      caption="Tanpa fungsi aktivasi non-linear, tumpukan layer sebanyak apa pun hanya setara satu transformasi linear. Aktivasi memungkinkan jaringan mempelajari pola melengkung."
      controls={<>{Object.keys(acts).map((k) => <Btn key={k} active={name === k} onClick={() => setName(k)}>{k}</Btn>)}<Slider label="Input x" value={x} min={-5} max={5} step={0.1} onChange={setX} /></>}
    >
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <svg viewBox="0 0 300 200" className="w-full rounded-xl border-2 border-ink bg-paper">
          <line x1={0} y1={110} x2={300} y2={110} stroke="#12203a" strokeOpacity={0.3} /><line x1={150} y1={0} x2={150} y2={200} stroke="#12203a" strokeOpacity={0.3} />
          {Object.entries(acts).map(([k, v]) => <path key={k} d={Array.from({ length: 101 }, (_, i) => { const t = -5 + i / 10; return `${i ? "L" : "M"}${X(t)},${Y(Math.max(-2, Math.min(4, v.f(t))))}`; }).join(" ")} fill="none" stroke={k === name ? "#12203a" : "#12203a"} strokeOpacity={k === name ? 1 : 0.12} strokeWidth={k === name ? 3 : 1.5} />)}
          <circle cx={X(x)} cy={Y(Math.max(-2, Math.min(4, a.f(x))))} r={7} fill="#fec536" stroke="#12203a" strokeWidth={2} />
        </svg>
        <div className="space-y-2"><Stat k={`${name}(${x.toFixed(1)})`} v={a.f(x).toFixed(4)} tone="warn" /><p className="text-sm leading-relaxed text-muted">{a.d}</p></div>
      </div>
    </VizFrame>
  );
}

/* ================= NEURON / PERCEPTRON ================= */
export function NeuronViz() {
  const [x1, setX1] = useState(0.8), [x2, setX2] = useState(0.3);
  const [w1, setW1] = useState(1.2), [w2, setW2] = useState(-0.7), [b, setB] = useState(0.1);
  const z = x1 * w1 + x2 * w2 + b;
  const y = 1 / (1 + Math.exp(-z));
  const lw = (w: number) => 1 + Math.abs(w) * 3;
  const lc = (w: number) => (w >= 0 ? "#2fb36b" : "#d9534f");
  return (
    <VizFrame
      title="Satu neuron: jumlah berbobot + aktivasi"
      caption="Neuron menghitung z = x₁·w₁ + x₂·w₂ + b lalu menerapkan aktivasi (di sini sigmoid). Garis hijau = bobot positif, merah = negatif; ketebalan menunjukkan besarnya. ‘Belajar’ berarti menyesuaikan w dan b agar output mendekati target."
      controls={<><Slider label="x₁" value={x1} min={-1} max={1} step={0.05} onChange={setX1} /><Slider label="x₂" value={x2} min={-1} max={1} step={0.05} onChange={setX2} /><Slider label="w₁" value={w1} min={-3} max={3} step={0.1} onChange={setW1} /><Slider label="w₂" value={w2} min={-3} max={3} step={0.1} onChange={setW2} /><Slider label="bias b" value={b} min={-2} max={2} step={0.1} onChange={setB} /></>}
    >
      <svg viewBox="0 0 420 180" className="w-full rounded-xl border-2 border-ink bg-paper">
        <line x1={70} y1={50} x2={210} y2={90} stroke={lc(w1)} strokeWidth={lw(w1)} /><line x1={70} y1={130} x2={210} y2={90} stroke={lc(w2)} strokeWidth={lw(w2)} />
        <line x1={250} y1={90} x2={350} y2={90} stroke="#12203a" strokeWidth={3} markerEnd="" />
        <text x={130} y={58} fontSize={11} fontWeight={700}>w₁={w1.toFixed(1)}</text><text x={130} y={132} fontSize={11} fontWeight={700}>w₂={w2.toFixed(1)}</text>
        {[[50, x1, "x₁"], [130, x2, "x₂"]].map(([cy, v, l]) => <g key={l as string}><circle cx={55} cy={cy as number} r={22} fill="#fff1c2" stroke="#12203a" strokeWidth={2} /><text x={55} y={(cy as number) + 4} textAnchor="middle" fontSize={11} fontWeight={800}>{(v as number).toFixed(2)}</text><text x={22} y={(cy as number) + 4} fontSize={11}>{l as string}</text></g>)}
        <circle cx={230} cy={90} r={32} fill="#fec536" stroke="#12203a" strokeWidth={2.5} /><text x={230} y={86} textAnchor="middle" fontSize={11} fontWeight={800}>Σ + σ</text><text x={230} y={101} textAnchor="middle" fontSize={10}>z={z.toFixed(2)}</text>
        <motion.circle cx={375} cy={90} r={24} stroke="#12203a" strokeWidth={2.5} animate={{ fill: `rgba(47,179,107,${y})` }} /><text x={375} y={94} textAnchor="middle" fontSize={12} fontWeight={800}>{y.toFixed(2)}</text>
      </svg>
    </VizFrame>
  );
}

/* ================= KONVOLUSI ================= */
const img = [
  [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 9, 9, 9, 9, 0, 0], [0, 0, 9, 9, 9, 9, 0, 0], [0, 0, 9, 9, 9, 9, 0, 0],
  [0, 0, 9, 9, 9, 9, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0],
];
const kernels: Record<string, number[][]> = {
  "Tepi vertikal": [[1, 0, -1], [1, 0, -1], [1, 0, -1]],
  "Tepi horizontal": [[1, 1, 1], [0, 0, 0], [-1, -1, -1]],
  Blur: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)),
  Sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
};
export function ConvolutionViz() {
  const [kn, setKn] = useState("Tepi vertikal");
  const [pos, setPos] = useState(9);
  const K = kernels[kn];
  const out = useMemo(() => Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => K.reduce((a, row, i) => a + row.reduce((s, k, j) => s + k * img[r + i][c + j], 0), 0))), [K]);
  const pr = Math.floor(pos / 6), pc = pos % 6;
  const maxAbs = Math.max(...out.flat().map(Math.abs), 1);
  const calc = K.flatMap((row, i) => row.map((k, j) => `${+k.toFixed(2)}×${img[pr + i][pc + j]}`)).join(" + ");
  return (
    <VizFrame
      title="Konvolusi 2D: kernel menyapu gambar"
      caption="Kernel 3×3 digeser di atas gambar; di setiap posisi, nilai piksel dikalikan bobot kernel lalu dijumlahkan menjadi satu piksel output (feature map). CNN tidak memakai kernel buatan tangan seperti ini. Ia mempelajari bobot kernelnya sendiri saat training."
      controls={<>{Object.keys(kernels).map((k) => <Btn key={k} active={kn === k} onClick={() => setKn(k)}>{k}</Btn>)}<Slider label="Posisi kernel" value={pos} min={0} max={35} onChange={setPos} /></>}
    >
      <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <p className="mb-1 text-xs font-bold">Input 8×8 (persegi terang)</p>
          <div className="grid grid-cols-8 gap-0.5">
            {img.flatMap((row, r) => row.map((v, c) => { const inK = r >= pr && r < pr + 3 && c >= pc && c < pc + 3; return <div key={`${r}${c}`} className={`grid aspect-square place-items-center rounded-sm font-mono text-[10px] ${inK ? "ring-2 ring-[#d9534f]" : ""}`} style={{ background: `rgb(${v * 26},${v * 26},${v * 22 + 30})`, color: v > 4 ? "#12203a" : "#fff" }}>{v}</div>; }))}
          </div>
        </div>
        <div className="self-center">
          <p className="mb-1 text-center text-xs font-bold">Kernel</p>
          <div className="grid grid-cols-3 gap-0.5 rounded-md border-2 border-[#d9534f] p-0.5">{K.flat().map((k, i) => <div key={i} className="grid size-9 place-items-center rounded-sm bg-sun-100 font-mono text-[11px] font-bold">{+k.toFixed(2)}</div>)}</div>
        </div>
        <div>
          <p className="mb-1 text-xs font-bold">Output 6×6 (feature map)</p>
          <div className="grid grid-cols-6 gap-0.5">
            {out.flatMap((row, r) => row.map((v, c) => { const t = v / maxAbs; return <button key={`${r}${c}`} onClick={() => setPos(r * 6 + c)} className={`grid aspect-square place-items-center rounded-sm font-mono text-[10px] font-bold ${r === pr && c === pc ? "ring-2 ring-[#d9534f]" : ""}`} style={{ background: t >= 0 ? `rgba(254,197,54,${t})` : `rgba(79,139,210,${-t})` }}>{Math.round(v)}</button>; }))}
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-lg border-2 border-ink bg-ink p-2.5 font-mono text-[11px] leading-relaxed text-paper/80">{calc} = <span className="font-bold text-sun-300">{out[pr][pc].toFixed(1)}</span></p>
    </VizFrame>
  );
}

/* ================= IoU ================= */
export function IouViz() {
  const gt = { x: 60, y: 50, w: 140, h: 110 };
  const [px, setPx] = useState(100), [py, setPy] = useState(80), [pw, setPw] = useState(140), [ph, setPh] = useState(110);
  const ix = Math.max(0, Math.min(gt.x + gt.w, px + pw) - Math.max(gt.x, px));
  const iy = Math.max(0, Math.min(gt.y + gt.h, py + ph) - Math.max(gt.y, py));
  const inter = ix * iy, uni = gt.w * gt.h + pw * ph - inter, iou = inter / uni;
  return (
    <VizFrame
      title="Intersection over Union (IoU)"
      caption="IoU = luas irisan ÷ luas gabungan kotak prediksi dan kotak ground truth. Deteksi biasanya dianggap benar bila IoU ≥ 0,5 (mAP50). Metrik mAP50-95 merata-ratakan threshold 0,5 sampai 0,95, sehingga menuntut kotak yang jauh lebih presisi."
      controls={<><Slider label="x prediksi" value={px} min={0} max={240} onChange={setPx} /><Slider label="y prediksi" value={py} min={0} max={150} onChange={setPy} /><Slider label="lebar" value={pw} min={30} max={220} onChange={setPw} /><Slider label="tinggi" value={ph} min={30} max={180} onChange={setPh} /></>}
    >
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <svg viewBox="0 0 360 240" className="w-full rounded-xl border-2 border-ink bg-paper">
          <rect {...{ x: gt.x, y: gt.y, width: gt.w, height: gt.h }} fill="#2fb36b" fillOpacity={0.15} stroke="#2fb36b" strokeWidth={3} />
          <rect x={px} y={py} width={pw} height={ph} fill="#fec536" fillOpacity={0.25} stroke="#d99a06" strokeWidth={3} strokeDasharray="6 4" />
          {inter > 0 && <rect x={Math.max(gt.x, px)} y={Math.max(gt.y, py)} width={ix} height={iy} fill="#12203a" fillOpacity={0.35} />}
          <text x={gt.x} y={gt.y - 6} fontSize={11} fontWeight={800} fill="#1f8a4c">ground truth</text><text x={px} y={py + ph + 14} fontSize={11} fontWeight={800} fill="#a87400">prediksi</text>
        </svg>
        <div className="space-y-2">
          <Stat k="Irisan" v={`${inter.toFixed(0)} px²`} /><Stat k="Gabungan" v={`${uni.toFixed(0)} px²`} />
          <Stat k="IoU" v={iou.toFixed(3)} tone={iou >= 0.75 ? "good" : iou >= 0.5 ? "warn" : "bad"} />
          <p className="text-xs text-muted">{iou >= 0.5 ? "Dihitung True Positive pada threshold 0,5." : "Dihitung False Positive pada threshold 0,5."}</p>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= TOKENIZER (ilustratif) ================= */
const vocab = ["belajar", "bel", "ajar", "mem", "pel", "ber", "kan", "an", "nya", "di", "ke", "data", "model", "bahasa", "token", "isasi", "ing", "learn", "machine", "satu", "tahu", "kom", "puter", "ter", "pro", "gram", "ming"];
function tokenize(s: string) {
  const out: string[] = [];
  for (const word of s.toLowerCase().split(/(\s+|[.,!?])/).filter((w) => w && w.trim())) {
    let w = word;
    while (w.length) {
      const m = [...vocab].sort((a, b) => b.length - a.length).find((v) => w.startsWith(v));
      const t = m ?? w[0];
      out.push(t); w = w.slice(t.length);
    }
  }
  return out;
}
export function TokenizerViz() {
  const [text, setText] = useState("Mempelajari model bahasa di SatuTahu");
  const toks = tokenize(text);
  const palette = ["#fff1c2", "#cfe3ff", "#d5f2df", "#ffd9cf", "#ece4ff"];
  return (
    <VizFrame
      title="Tokenisasi subword (ilustrasi)"
      hint="Ketik teks"
      caption="LLM tidak membaca huruf atau kata utuh, melainkan token: potongan yang ada di kosakatanya. Kata umum jadi 1 token; kata jarang dipecah menjadi beberapa subword, bahkan karakter. Kosakata di demo ini kecil dan dibuat tangan; tokenizer asli (BPE) mempelajari puluhan ribu token dari data. Bahasa Indonesia sering butuh lebih banyak token daripada bahasa Inggris, sehingga lebih mahal per kalimat."
      controls={<input aria-label="Teks yang ditokenisasi" value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 text-sm" />}
    >
      <div className="flex flex-wrap gap-1">
        {toks.map((t, i) => <motion.span key={`${t}-${i}`} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.02 }} className="rounded-md border-2 border-ink px-1.5 py-0.5 font-mono text-sm" style={{ background: palette[i % palette.length] }}>{t}</motion.span>)}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2"><Stat k="Karakter" v={text.length} /><Stat k="Token" v={toks.length} tone="warn" /><Stat k="Karakter/token" v={(text.length / Math.max(toks.length, 1)).toFixed(2)} /></div>
    </VizFrame>
  );
}

/* ================= ATTENTION (ilustratif) ================= */
const sent = ["Budi", "menaruh", "buku", "di", "meja", "karena", "ia", "berat"];
const attn: number[][] = [
  [.5, .2, .1, 0, .05, 0, .15, 0], [.25, .3, .3, .05, .05, 0, .05, 0], [.1, .3, .4, .05, .1, 0, 0, .05], [0, .1, .1, .4, .4, 0, 0, 0],
  [0, .1, .15, .3, .4, 0, 0, .05], [.05, .2, .1, 0, .05, .4, .1, .1], [.15, .05, .55, 0, .1, .05, .1, 0], [.05, .05, .5, 0, .1, .1, .1, .1],
];
export function AttentionViz() {
  const [q, setQ] = useState(6);
  return (
    <VizFrame
      title="Self-attention: kata mana yang diperhatikan?"
      hint="Klik kata"
      caption="Setiap token membuat query yang dibandingkan dengan key semua token; hasil softmax-nya menjadi bobot perhatian. Pada contoh ini, ‘ia’ paling memperhatikan ‘buku’ karena yang berat adalah buku. Bobot di sini ilustrasi yang dibuat tangan, bukan keluaran model sungguhan; model asli punya banyak ‘head’ dengan pola berbeda-beda."
    >
      <div className="flex flex-wrap justify-center gap-1.5">
        {sent.map((w, i) => (
          <button key={w} onClick={() => setQ(i)} className={`relative rounded-lg border-2 border-ink px-2.5 py-1.5 font-mono text-sm font-bold ${i === q ? "bg-ink text-sun-300" : ""}`} style={i === q ? {} : { background: `rgba(254,197,54,${attn[q][i] * 1.8})` }}>
            {w}<span className="absolute -top-2.5 -right-1 rounded bg-paper px-1 text-[9px] font-bold text-ink ring-1 ring-ink">{(attn[q][i] * 100).toFixed(0)}%</span>
          </button>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-md">
        <p className="mb-1 text-xs font-bold">Matriks attention (baris = query, kolom = key)</p>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `60px repeat(${sent.length}, 1fr)` }}>
          <span />{sent.map((w) => <span key={w} className="truncate text-center font-mono text-[9px]">{w}</span>)}
          {attn.map((row, r) => [<button key={`l${r}`} onClick={() => setQ(r)} className={`truncate text-right font-mono text-[10px] ${r === q ? "font-extrabold" : ""}`}>{sent[r]}</button>, ...row.map((v, c) => <div key={`${r}${c}`} className={`aspect-square rounded-sm ${r === q ? "ring-1 ring-ink" : ""}`} style={{ background: `rgba(18,32,58,${v * 1.7})` }} />)])}
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= EMBEDDING & SIMILARITY ================= */
const docs = [
  { t: "Cara mendaftar KRS online", x: 0.82, y: 0.7 }, { t: "Jadwal pengisian KRS semester genap", x: 0.9, y: 0.6 }, { t: "Syarat cuti akademik", x: 0.55, y: 0.85 },
  { t: "Lokasi perpustakaan pusat", x: -0.6, y: 0.5 }, { t: "Jam buka perpustakaan", x: -0.75, y: 0.35 }, { t: "Biaya UKT per golongan", x: 0.2, y: -0.8 }, { t: "Cara banding UKT", x: 0.35, y: -0.7 },
];
const queries = [{ t: "kapan isi KRS?", x: 0.88, y: 0.66 }, { t: "perpus buka jam berapa", x: -0.7, y: 0.42 }, { t: "uang kuliah mahal, bisa turun?", x: 0.3, y: -0.76 }];
export function EmbeddingViz() {
  const [qi, setQi] = useState(0);
  const [k, setK] = useState(2);
  const q = queries[qi];
  const cos = (a: { x: number; y: number }, b: { x: number; y: number }) => (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  const ranked = docs.map((d) => ({ ...d, s: cos(q, d) })).sort((a, b) => b.s - a.s);
  const top = ranked.slice(0, k).map((d) => d.t);
  const S = (v: number) => 130 + v * 110;
  return (
    <VizFrame
      title="Embedding & pencarian semantik (retrieve pada RAG)"
      caption="Embedding mengubah teks menjadi vektor sehingga makna yang mirip berdekatan. Perhatikan: ‘perpus’ tetap cocok dengan ‘perpustakaan’ walau katanya berbeda. Itulah kelebihan dibanding pencarian kata kunci. Embedding asli berdimensi ratusan–ribuan; di sini diproyeksikan ke 2D sebagai ilustrasi."
      controls={<>{queries.map((x, i) => <Btn key={x.t} active={qi === i} onClick={() => setQi(i)}>“{x.t}”</Btn>)}<Slider label="Top-k" value={k} min={1} max={4} onChange={setK} /></>}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_1.1fr]">
        <svg viewBox="0 0 260 260" className="mx-auto w-full max-w-[320px] rounded-xl border-2 border-ink bg-paper">
          <circle cx={130} cy={130} r={2} fill="#12203a" />
          {docs.map((d) => <g key={d.t}><line x1={130} y1={130} x2={S(d.x)} y2={S(-d.y)} stroke="#12203a" strokeOpacity={top.includes(d.t) ? 0.6 : 0.1} /><circle cx={S(d.x)} cy={S(-d.y)} r={top.includes(d.t) ? 8 : 6} fill={top.includes(d.t) ? "#fec536" : "#cfe3ff"} stroke="#12203a" strokeWidth={1.5} /></g>)}
          <line x1={130} y1={130} x2={S(q.x)} y2={S(-q.y)} stroke="#d9534f" strokeWidth={2.5} /><rect x={S(q.x) - 7} y={S(-q.y) - 7} width={14} height={14} fill="#d9534f" stroke="#12203a" strokeWidth={1.5} transform={`rotate(45 ${S(q.x)} ${S(-q.y)})`} />
        </svg>
        <ol className="space-y-1.5">
          {ranked.map((d, i) => <li key={d.t} className={`flex items-center justify-between gap-2 rounded-lg border-2 px-2.5 py-1.5 text-sm ${i < k ? "border-ink bg-sun-100 font-bold" : "border-line bg-paper text-muted"}`}><span>{d.t}</span><span className="font-mono text-xs">{d.s.toFixed(3)}</span></li>)}
        </ol>
      </div>
    </VizFrame>
  );
}

/* ================= TEMPERATURE & SOFTMAX ================= */
const cand = [{ w: "kuliah", l: 3.1 }, { w: "belajar", l: 2.8 }, { w: "kerja", l: 2.0 }, { w: "tidur", l: 1.2 }, { w: "mancing", l: 0.4 }, { w: "terbang", l: -0.5 }];
export function TemperatureViz() {
  const [t, setT] = useState(1);
  const [topP, setTopP] = useState(1);
  const ex = cand.map((c) => Math.exp(c.l / Math.max(t, 0.05)));
  const sum = ex.reduce((a, b) => a + b, 0);
  const probs = cand.map((c, i) => ({ ...c, p: ex[i] / sum })).sort((a, b) => b.p - a.p);
  let cum = 0;
  const kept = probs.map((p) => { const keep = cum < topP; cum += p.p; return keep; });
  return (
    <VizFrame
      title="Sampling LLM: temperature & top-p"
      caption="Model menghasilkan skor (logit) untuk setiap kandidat token berikutnya setelah ‘Besok pagi saya mau …’. Softmax mengubahnya menjadi peluang. Temperature rendah menajamkan distribusi (jawaban konsisten); tinggi meratakannya (lebih kreatif, lebih berisiko ngawur). Top-p hanya menyisakan token teratas yang total peluangnya mencapai p."
      controls={<><Slider label="Temperature" value={t} min={0.05} max={2} step={0.05} onChange={setT} /><Slider label="Top-p" value={topP} min={0.1} max={1} step={0.05} onChange={setTopP} /></>}
    >
      <p className="mb-3 font-mono text-sm">Besok pagi saya mau <span className="rounded bg-sun-300 px-1">___</span></p>
      <div className="space-y-1.5">
        {probs.map((p, i) => (
          <div key={p.w} className={`flex items-center gap-2 ${kept[i] ? "" : "opacity-30"}`}>
            <span className="w-20 font-mono text-sm font-bold">{p.w}</span>
            <div className="h-6 flex-1 overflow-hidden rounded-md border-2 border-ink bg-paper"><motion.div className="h-full bg-sun-400" animate={{ width: `${p.p * 100}%` }} /></div>
            <span className="w-14 text-right font-mono text-xs">{(p.p * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </VizFrame>
  );
}
