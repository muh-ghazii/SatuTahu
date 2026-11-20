"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Pause, Play, RotateCcw, Shuffle, StepForward } from "lucide-react";
import { Btn, Slider, Stat, VizFrame } from "./Frame";

/* util: RNG deterministik */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}
function gauss(r: () => number) {
  const u = Math.max(r(), 1e-9), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const W = 520, H = 240;

/* ================= DISTRIBUSI NORMAL ================= */
export function DistributionViz() {
  const [mu, setMu] = useState(70);
  const [sd, setSd] = useState(10);
  const [n, setN] = useState(200);
  const [seed, setSeed] = useState(1);
  const sample = useMemo(() => { const r = rng(seed); return Array.from({ length: n }, () => mu + sd * gauss(r)); }, [mu, sd, n, seed]);
  const bins = 24, lo = 20, hi = 120, bw = (hi - lo) / bins;
  const counts = Array(bins).fill(0);
  sample.forEach((x) => { const b = Math.floor((x - lo) / bw); if (b >= 0 && b < bins) counts[b]++; });
  const maxC = Math.max(...counts, 1);
  const pdf = (x: number) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
  const scale = n * bw;
  const mean = sample.reduce((a, b) => a + b, 0) / n;
  const sorted = [...sample].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];
  const sdS = Math.sqrt(sample.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const within = sample.filter((x) => Math.abs(x - mu) <= sd).length / n;
  const yMax = Math.max(maxC, pdf(mu) * scale) * 1.1;
  return (
    <VizFrame
      title="Distribusi normal & sampel"
      caption="Histogram adalah sampel acak (mis. nilai ujian); kurva adalah distribusi teoritisnya. Sekitar 68% data berada dalam ±1 simpangan baku dari rata-rata. Perbesar ukuran sampel: histogram makin mirip kurva (hukum bilangan besar)."
      controls={
        <>
          <Slider label="Rata-rata μ" value={mu} min={40} max={100} onChange={setMu} />
          <Slider label="Simpangan baku σ" value={sd} min={3} max={25} onChange={setSd} />
          <Slider label="Ukuran sampel n" value={n} min={20} max={2000} step={20} onChange={setN} />
          <Btn onClick={() => setSeed((s) => s + 1)}><Shuffle className="size-3.5" />Sampel baru</Btn>
        </>
      }
    >
      <svg viewBox={`-10 -10 ${W + 20} ${H + 30}`} className="w-full rounded-xl border-2 border-ink bg-paper">
        <rect x={((mu - sd - lo) / (hi - lo)) * W} y={0} width={((2 * sd) / (hi - lo)) * W} height={H} fill="#fff1c2" />
        {counts.map((c, i) => <rect key={i} x={(i / bins) * W + 1} y={H - (c / yMax) * H} width={W / bins - 2} height={(c / yMax) * H} fill="#fec536" stroke="#12203a" strokeWidth={1} />)}
        <path d={Array.from({ length: 101 }, (_, i) => { const x = lo + (i / 100) * (hi - lo); return `${i ? "L" : "M"}${(i / 100) * W},${H - ((pdf(x) * scale) / yMax) * H}`; }).join(" ")} fill="none" stroke="#12203a" strokeWidth={2.5} />
        <line x1={0} y1={H} x2={W} y2={H} stroke="#12203a" />
        {[20, 40, 60, 80, 100, 120].map((t) => <text key={t} x={((t - lo) / (hi - lo)) * W} y={H + 14} fontSize={10} textAnchor="middle" fill="#59647a">{t}</text>)}
      </svg>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat k="Mean sampel" v={mean.toFixed(2)} /><Stat k="Median" v={median.toFixed(2)} /><Stat k="Std sampel" v={sdS.toFixed(2)} /><Stat k="Dalam μ ± σ" v={`${(within * 100).toFixed(1)}%`} tone="warn" />
      </div>
    </VizFrame>
  );
}

/* ================= REGRESI LINEAR ================= */
export function RegressionViz() {
  const pts = useMemo(() => { const r = rng(7); return Array.from({ length: 24 }, (_, i) => { const x = 1 + (i / 23) * 9; return { x, y: 2.1 * x + 5 + gauss(r) * 2.2 }; }); }, []);
  const [m, setM] = useState(1);
  const [b, setB] = useState(8);
  const mse = pts.reduce((a, p) => a + (p.y - (m * p.x + b)) ** 2, 0) / pts.length;
  const fit = () => {
    const n = pts.length, sx = pts.reduce((a, p) => a + p.x, 0), sy = pts.reduce((a, p) => a + p.y, 0);
    const sxy = pts.reduce((a, p) => a + p.x * p.y, 0), sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
    const mm = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    setM(+mm.toFixed(2)); setB(+((sy - mm * sx) / n).toFixed(2));
  };
  const X = (x: number) => (x / 11) * W, Y = (y: number) => H - (y / 32) * H;
  return (
    <VizFrame
      title="Regresi linear: mencari garis terbaik"
      caption="Model y = m·x + b. Garis merah putus-putus adalah error (residual) tiap titik. Mean Squared Error (MSE) adalah rata-rata kuadrat residual; ‘training’ berarti mencari m dan b yang membuat MSE sekecil mungkin. Coba atur manual, lalu bandingkan dengan solusi least squares."
      controls={<><Slider label="Kemiringan m" value={m} min={-1} max={4} step={0.05} onChange={setM} /><Slider label="Intercept b" value={b} min={-5} max={15} step={0.1} onChange={setB} /><Btn onClick={fit}>Hitung least squares</Btn></>}
    >
      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr]">
        <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} className="w-full rounded-xl border-2 border-ink bg-paper">
          {pts.map((p, i) => <line key={`r${i}`} x1={X(p.x)} y1={Y(p.y)} x2={X(p.x)} y2={Y(m * p.x + b)} stroke="#d9534f" strokeDasharray="3 3" />)}
          <line x1={X(0)} y1={Y(b)} x2={X(11)} y2={Y(m * 11 + b)} stroke="#12203a" strokeWidth={3} />
          {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={5} fill="#fec536" stroke="#12203a" strokeWidth={1.5} />)}
        </svg>
        <div className="space-y-2">
          <Stat k="Persamaan" v={`y = ${m.toFixed(2)}x + ${b.toFixed(2)}`} />
          <Stat k="MSE" v={mse.toFixed(2)} tone={mse < 6 ? "good" : mse < 20 ? "warn" : "bad"} />
          <p className="text-xs text-muted">Data dibangkitkan dari y = 2,1x + 5 + noise, jadi solusi terbaik akan mendekati nilai itu, tetapi tidak persis sama karena noise.</p>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= GRADIENT DESCENT ================= */
export function GradientDescentViz() {
  const f = (x: number) => 0.15 * x ** 4 - 0.6 * x ** 3 + 0.2 * x ** 2 + 1.6 * x + 4;
  const df = (x: number) => 0.6 * x ** 3 - 1.8 * x ** 2 + 0.4 * x + 1.6;
  const [lr, setLr] = useState(0.1);
  const [x0, setX0] = useState(-1.4);
  const [hist, setHist] = useState<number[]>([-1.4]);
  const [play, setPlay] = useState(false);
  const cur = hist.at(-1)!;
  useEffect(() => { setHist([x0]); setPlay(false); }, [x0, lr]);
  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setHist((h) => { const x = h.at(-1)!; const nx = x - lr * df(x); if (h.length > 60 || !Number.isFinite(nx) || Math.abs(nx) > 8) { setPlay(false); return h; } return [...h, nx]; }), 260);
    return () => clearInterval(id);
  }, [play, lr]);
  const X = (x: number) => ((x + 2) / 6.5) * W, Y = (y: number) => H - ((y + 1) / 12) * H;
  return (
    <VizFrame
      title="Gradient descent"
      caption="Model belajar dengan menuruni ‘bukit’ loss: hitung kemiringan (gradien), lalu melangkah berlawanan arah sejauh learning rate × gradien. Learning rate terlalu kecil = lambat; terlalu besar = melompat-lompat atau meledak. Titik awal yang berbeda bisa berakhir di minimum lokal yang berbeda."
      controls={
        <>
          <Slider label="Learning rate" value={lr} min={0.01} max={0.9} step={0.01} onChange={setLr} />
          <Slider label="Titik awal" value={x0} min={-1.8} max={4.2} step={0.1} onChange={setX0} />
          <Btn onClick={() => setPlay((p) => !p)}>{play ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{play ? "Jeda" : "Jalankan"}</Btn>
          <Btn title="Satu langkah" onClick={() => setHist((h) => [...h, h.at(-1)! - lr * df(h.at(-1)!)])}><StepForward className="size-3.5" /></Btn>
          <Btn title="Ulang dari awal" onClick={() => setHist([x0])}><RotateCcw className="size-3.5" /></Btn>
        </>
      }
    >
      <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} className="w-full rounded-xl border-2 border-ink bg-paper">
        <path d={Array.from({ length: 131 }, (_, i) => { const x = -2 + (i / 130) * 6.5; return `${i ? "L" : "M"}${X(x)},${Y(f(x))}`; }).join(" ")} fill="none" stroke="#12203a" strokeWidth={2.5} />
        {hist.slice(1).map((x, i) => <line key={i} x1={X(hist[i])} y1={Y(f(hist[i]))} x2={X(x)} y2={Y(f(x))} stroke="#d9534f" strokeWidth={1.5} />)}
        {hist.map((x, i) => Math.abs(x) < 8 && <circle key={`p${i}`} cx={X(x)} cy={Y(f(x))} r={i === hist.length - 1 ? 7 : 3.5} fill={i === hist.length - 1 ? "#fec536" : "#d9534f"} stroke="#12203a" strokeWidth={1.5} />)}
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat k="Iterasi" v={hist.length - 1} /><Stat k="Posisi x" v={Math.abs(cur) < 8 ? cur.toFixed(3) : "meledak!"} tone={Math.abs(cur) < 8 ? undefined : "bad"} /><Stat k="Loss f(x)" v={Math.abs(cur) < 8 ? f(cur).toFixed(3) : "∞"} />
      </div>
    </VizFrame>
  );
}

/* ================= K-MEANS ================= */
export function KMeansViz() {
  const pts = useMemo(() => { const r = rng(3); const cs = [[2, 2], [7, 3], [4.5, 7.5], [8, 8]]; return Array.from({ length: 80 }, (_, i) => { const c = cs[i % 4]; return { x: c[0] + gauss(r) * 0.9, y: c[1] + gauss(r) * 0.9 }; }); }, []);
  const [k, setK] = useState(3);
  const [seed, setSeed] = useState(1);
  const [cents, setCents] = useState<{ x: number; y: number }[]>([]);
  const [phase, setPhase] = useState<"assign" | "update">("assign");
  const [iter, setIter] = useState(0);
  useEffect(() => { const r = rng(seed * 99); setCents(Array.from({ length: k }, () => ({ x: 1 + r() * 8, y: 1 + r() * 8 }))); setIter(0); setPhase("assign"); }, [k, seed]);
  const assign = pts.map((p) => cents.reduce((best, c, i) => ((p.x - c.x) ** 2 + (p.y - c.y) ** 2 < (p.x - cents[best].x) ** 2 + (p.y - cents[best].y) ** 2 ? i : best), 0));
  const colors = ["#fec536", "#4f8bd2", "#2fb36b", "#d9534f", "#9b6bd6", "#e07a2f"];
  const step = () => {
    if (phase === "assign") setPhase("update");
    else { setCents(cents.map((c, i) => { const m = pts.filter((_, j) => assign[j] === i); return m.length ? { x: m.reduce((a, p) => a + p.x, 0) / m.length, y: m.reduce((a, p) => a + p.y, 0) / m.length } : c; })); setIter(iter + 1); setPhase("assign"); }
  };
  const inertia = pts.reduce((a, p, j) => a + (p.x - (cents[assign[j]]?.x ?? 0)) ** 2 + (p.y - (cents[assign[j]]?.y ?? 0)) ** 2, 0);
  const S = (v: number) => (v / 10) * 300;
  return (
    <VizFrame
      title="K-Means clustering langkah demi langkah"
      caption="Dua langkah diulang: (1) setiap titik bergabung ke centroid terdekat, (2) centroid pindah ke rata-rata anggotanya. Ulangi sampai stabil. Data ini sebenarnya punya 4 kelompok; coba k = 2…6 dan perhatikan inertia. Pemilihan k adalah keputusanmu, bukan algoritmanya."
      controls={<><Slider label="Jumlah cluster k" value={k} min={2} max={6} onChange={setK} /><Btn onClick={step}><StepForward className="size-3.5" />{phase === "assign" ? "Perbarui centroid" : "Tetapkan cluster"}</Btn><Btn onClick={() => setSeed(seed + 1)}><Shuffle className="size-3.5" />Inisialisasi ulang</Btn></>}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_200px]">
        <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[380px] rounded-xl border-2 border-ink bg-paper">
          {pts.map((p, i) => <circle key={i} cx={S(p.x)} cy={300 - S(p.y)} r={4.5} fill={colors[assign[i]] ?? "#ccc"} stroke="#12203a" strokeWidth={0.8} />)}
          {cents.map((c, i) => <motion.g key={i} animate={{ x: S(c.x), y: 300 - S(c.y) }} transition={{ type: "spring", stiffness: 120, damping: 18 }}><rect x={-9} y={-9} width={18} height={18} fill={colors[i]} stroke="#12203a" strokeWidth={3} transform="rotate(45)" /></motion.g>)}
        </svg>
        <div className="space-y-2"><Stat k="Iterasi" v={iter} /><Stat k="Inertia (makin kecil makin rapat)" v={inertia.toFixed(1)} /></div>
      </div>
    </VizFrame>
  );
}

/* ================= CONFUSION MATRIX & THRESHOLD ================= */
export function ConfusionViz() {
  const data = useMemo(() => { const r = rng(11); return Array.from({ length: 200 }, (_, i) => { const y = i < 60 ? 1 : 0; const s = 1 / (1 + Math.exp(-(gauss(r) * 1.3 + (y ? 1.4 : -1.2)))); return { y, s }; }); }, []);
  const [t, setT] = useState(0.5);
  let tp = 0, fp = 0, fn = 0, tn = 0;
  data.forEach((d) => { const p = d.s >= t ? 1 : 0; if (p && d.y) tp++; else if (p && !d.y) fp++; else if (!p && d.y) fn++; else tn++; });
  const prec = tp / Math.max(tp + fp, 1), rec = tp / Math.max(tp + fn, 1), acc = (tp + tn) / data.length, f1 = (2 * prec * rec) / Math.max(prec + rec, 1e-9);
  const Cell = ({ k, v, good }: { k: string; v: number; good: boolean }) => <div className={`rounded-lg border-2 border-ink p-3 text-center ${good ? "bg-[#dff5e7]" : "bg-[#ffe4dc]"}`}><p className="text-[10px] font-extrabold uppercase">{k}</p><p className="font-mono text-2xl font-extrabold">{v}</p></div>;
  return (
    <VizFrame
      title="Confusion matrix, precision & recall"
      caption="Model memberi skor 0–1 (mis. ‘kemungkinan spam’). Threshold menentukan kapan skor dianggap positif. Menaikkan threshold → precision naik tapi recall turun. Data ini tidak seimbang (60 positif, 140 negatif), jadi akurasi saja bisa menyesatkan."
      controls={<Slider label="Threshold" value={t} min={0.05} max={0.95} step={0.01} onChange={setT} />}
    >
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-1 grid grid-cols-[70px_1fr_1fr] gap-1.5 text-center text-[10px] font-bold text-muted"><span /><span>Prediksi +</span><span>Prediksi −</span></div>
          <div className="grid grid-cols-[70px_1fr_1fr] items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted">Aktual +</span><Cell k="True Positive" v={tp} good /><Cell k="False Negative" v={fn} good={false} />
            <span className="text-[10px] font-bold text-muted">Aktual −</span><Cell k="False Positive" v={fp} good={false} /><Cell k="True Negative" v={tn} good />
          </div>
          <svg viewBox="0 0 300 70" className="mt-3 w-full rounded-lg border-2 border-ink bg-paper">
            {data.map((d, i) => <circle key={i} cx={8 + d.s * 284} cy={d.y ? 20 + (i % 6) * 3 : 46 + (i % 6) * 3} r={2.6} fill={d.y ? "#d9534f" : "#4f8bd2"} />)}
            <line x1={8 + t * 284} y1={0} x2={8 + t * 284} y2={70} stroke="#12203a" strokeWidth={2} />
            <text x={4} y={12} fontSize={8} fill="#d9534f">positif</text><text x={4} y={68} fontSize={8} fill="#4f8bd2">negatif</text>
          </svg>
        </div>
        <div className="grid grid-cols-2 content-start gap-2">
          <Stat k="Akurasi" v={`${(acc * 100).toFixed(1)}%`} />
          <Stat k="Precision" v={`${(prec * 100).toFixed(1)}%`} tone="warn" />
          <Stat k="Recall" v={`${(rec * 100).toFixed(1)}%`} tone="warn" />
          <Stat k="F1-score" v={f1.toFixed(3)} />
          <p className="col-span-2 text-xs text-muted">Precision = TP/(TP+FP): dari yang ditebak positif, berapa yang benar. Recall = TP/(TP+FN): dari yang benar-benar positif, berapa yang tertangkap.</p>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= OVERFITTING (regresi polinomial) ================= */
function polyfit(xs: number[], ys: number[], deg: number) {
  const n = deg + 1;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (j < n ? xs.reduce((a, x) => a + x ** (i + j), 0) + (i === j ? 1e-6 : 0) : xs.reduce((a, x, k) => a + ys[k] * x ** i, 0))));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= f * A[c][j]; }
  }
  return A.map((row, i) => row[n] / A[i][i]);
}
export function OverfitViz() {
  const { tr, te } = useMemo(() => {
    const r = rng(5); const g = (x: number) => Math.sin(x * 2.6) * 0.8 + 0.3 * x;
    const mk = (n: number) => Array.from({ length: n }, () => { const x = r() * 2 - 1; return { x, y: g(x) + gauss(r) * 0.18 }; });
    return { tr: mk(14), te: mk(40) };
  }, []);
  const [deg, setDeg] = useState(1);
  const errs = useMemo(() => Array.from({ length: 12 }, (_, d) => {
    const c = polyfit(tr.map((p) => p.x), tr.map((p) => p.y), d + 1);
    const pr = (x: number) => c.reduce((a, k, i) => a + k * x ** i, 0);
    const mse = (s: { x: number; y: number }[]) => s.reduce((a, p) => a + (p.y - pr(p.x)) ** 2, 0) / s.length;
    return { c, train: mse(tr), test: mse(te) };
  }), [tr, te]);
  const cur = errs[deg - 1];
  const pr = (x: number) => cur.c.reduce((a, k, i) => a + k * x ** i, 0);
  const X = (x: number) => ((x + 1) / 2) * 300, Y = (y: number) => 120 - Math.max(-2.2, Math.min(2.2, y)) * 50;
  const ex = (v: number) => Math.min(v, 0.5);
  return (
    <VizFrame
      title="Underfitting vs overfitting"
      caption="Titik kuning = data latih (14 titik), titik biru = data uji. Derajat polinomial rendah terlalu kaku (underfit). Derajat tinggi menghafal data latih: error latih turun terus, tetapi error uji naik (overfit). Model terbaik adalah yang error ujinya terendah, bukan error latihnya."
      controls={<Slider label="Kompleksitas model (derajat polinomial)" value={deg} min={1} max={12} onChange={setDeg} />}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <svg viewBox="0 0 300 240" className="w-full rounded-xl border-2 border-ink bg-paper">
          {te.map((p, i) => <circle key={`t${i}`} cx={X(p.x)} cy={Y(p.y)} r={3} fill="#9cc3ff" />)}
          <path d={Array.from({ length: 121 }, (_, i) => { const x = -1 + (i / 120) * 2; return `${i ? "L" : "M"}${X(x)},${Y(pr(x))}`; }).join(" ")} fill="none" stroke="#12203a" strokeWidth={2.5} />
          {tr.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={5} fill="#fec536" stroke="#12203a" strokeWidth={1.5} />)}
        </svg>
        <div>
          <svg viewBox="0 0 300 160" className="w-full rounded-xl border-2 border-ink bg-paper">
            {(["train", "test"] as const).map((k) => <path key={k} d={errs.map((e, i) => `${i ? "L" : "M"}${15 + i * 25},${145 - (ex(e[k]) / 0.5) * 130}`).join(" ")} fill="none" stroke={k === "train" ? "#f5b316" : "#4f8bd2"} strokeWidth={3} />)}
            <line x1={15 + (deg - 1) * 25} y1={5} x2={15 + (deg - 1) * 25} y2={150} stroke="#12203a" strokeDasharray="4 3" />
            <text x={20} y={14} fontSize={10} fill="#f5b316" fontWeight={700}>error latih</text><text x={90} y={14} fontSize={10} fill="#4f8bd2" fontWeight={700}>error uji</text>
          </svg>
          <div className="mt-2 grid grid-cols-2 gap-2"><Stat k="MSE latih" v={cur.train.toFixed(3)} /><Stat k="MSE uji" v={cur.test.toFixed(3)} tone={cur.test < 0.06 ? "good" : cur.test < 0.15 ? "warn" : "bad"} /></div>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= GROUPBY: split-apply-combine ================= */
const sales = [
  { kota: "Banjarmasin", produk: "Gamis", qty: 12 }, { kota: "Kotabaru", produk: "Jilbab", qty: 30 }, { kota: "Banjarmasin", produk: "Jilbab", qty: 18 },
  { kota: "Martapura", produk: "Gamis", qty: 7 }, { kota: "Kotabaru", produk: "Gamis", qty: 9 }, { kota: "Martapura", produk: "Jilbab", qty: 15 }, { kota: "Kotabaru", produk: "Seragam", qty: 22 },
];
export function GroupByViz() {
  const [key, setKey] = useState<"kota" | "produk">("kota");
  const [agg, setAgg] = useState<"sum" | "mean" | "count">("sum");
  const [stage, setStage] = useState(0);
  const groups = [...new Set(sales.map((s) => s[key]))];
  const colors = ["bg-sun-200", "bg-[#cfe3ff]", "bg-[#d5f2df]", "bg-[#ffd9cf]"];
  const val = (g: string) => { const q = sales.filter((s) => s[key] === g).map((s) => s.qty); return agg === "sum" ? q.reduce((a, b) => a + b, 0) : agg === "count" ? q.length : +(q.reduce((a, b) => a + b, 0) / q.length).toFixed(1); };
  return (
    <VizFrame
      title="groupby: split → apply → combine"
      caption="df.groupby(kolom)[‘qty’].agg(fungsi) bekerja dalam tiga tahap: memecah baris berdasarkan nilai kunci, menerapkan fungsi agregasi pada tiap kelompok, lalu menggabungkan hasilnya menjadi tabel baru. Pola yang sama berlaku pada GROUP BY di SQL."
      controls={
        <>
          <Btn active={key === "kota"} onClick={() => setKey("kota")}>by kota</Btn><Btn active={key === "produk"} onClick={() => setKey("produk")}>by produk</Btn>
          {(["sum", "mean", "count"] as const).map((a) => <Btn key={a} active={agg === a} onClick={() => setAgg(a)}>{a}()</Btn>)}
          <Btn onClick={() => setStage((s) => (s + 1) % 3)}><StepForward className="size-3.5" />{["Split", "Apply", "Combine"][(stage + 1) % 3]}</Btn>
        </>
      }
    >
      <pre className="mb-3 rounded-lg border-2 border-ink bg-ink p-2.5 font-mono text-[12px] text-paper">{`df.groupby("${key}")["qty"].${agg}()`}</pre>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border-2 border-ink bg-paper p-2 text-xs">
          <p className="mb-1 font-extrabold">Data asli</p>
          {sales.map((s, i) => <div key={i} className={`mb-0.5 flex justify-between rounded px-1.5 py-0.5 font-mono ${stage >= 0 ? colors[groups.indexOf(s[key]) % 4] : ""}`}><span>{s.kota.slice(0, 11)}</span><span>{s.produk}</span><span>{s.qty}</span></div>)}
        </div>
        <div className={`rounded-xl border-2 border-ink bg-paper p-2 text-xs transition-opacity ${stage >= 1 ? "opacity-100" : "opacity-30"}`}>
          <p className="mb-1 font-extrabold">Split & apply</p>
          {groups.map((g, i) => <div key={g} className={`mb-1 rounded-md border border-ink/30 p-1.5 font-mono ${colors[i % 4]}`}><b>{g}</b>: [{sales.filter((s) => s[key] === g).map((s) => s.qty).join(", ")}] → {agg} = <b>{val(g)}</b></div>)}
        </div>
        <div className={`rounded-xl border-2 border-ink bg-paper p-2 text-xs transition-opacity ${stage >= 2 ? "opacity-100" : "opacity-30"}`}>
          <p className="mb-1 font-extrabold">Combine (hasil)</p>
          <table className="w-full font-mono"><thead><tr className="border-b border-ink"><th className="text-left">{key}</th><th className="text-right">qty</th></tr></thead><tbody>{groups.map((g) => <tr key={g}><td>{g}</td><td className="text-right font-bold">{val(g)}</td></tr>)}</tbody></table>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= A/B TEST ================= */
function normCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
export function AbTestViz() {
  const [n, setN] = useState(1000);
  const [pa, setPa] = useState(5);
  const [pb, setPb] = useState(6);
  const ca = Math.round((n * pa) / 100), cb = Math.round((n * pb) / 100);
  const p1 = ca / n, p2 = cb / n, pp = (ca + cb) / (2 * n);
  const se = Math.sqrt(pp * (1 - pp) * (2 / n));
  const z = se ? (p2 - p1) / se : 0;
  const pval = 2 * (1 - normCdf(Math.abs(z)));
  const sig = pval < 0.05;
  return (
    <VizFrame
      title="A/B test: apakah perbedaannya nyata?"
      caption="Dua versi halaman diuji pada kelompok berbeda. Uji-z dua proporsi menghitung p-value: peluang melihat selisih sebesar ini bila sebenarnya tidak ada perbedaan. Perhatikan: selisih 5% → 6% tidak signifikan pada 1.000 pengunjung, tetapi signifikan pada ~10.000. Ukuran sampel menentukan."
      controls={<><Slider label="Pengunjung per varian" value={n} min={100} max={20000} step={100} onChange={setN} /><Slider label="Konversi A (%)" value={pa} min={1} max={20} step={0.1} onChange={setPa} /><Slider label="Konversi B (%)" value={pb} min={1} max={20} step={0.1} onChange={setPb} /></>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[["Varian A (lama)", ca, p1], ["Varian B (baru)", cb, p2]].map(([l, c, p]) => (
          <div key={l as string} className="rounded-xl border-2 border-ink bg-paper p-3">
            <p className="text-sm font-extrabold">{l as string}</p>
            <div className="mt-2 h-3 overflow-hidden rounded-full border border-ink bg-cream"><div className="h-full bg-sun-400" style={{ width: `${(p as number) * 400}%` }} /></div>
            <p className="mt-1 font-mono text-xs">{(c as number).toLocaleString("id-ID")} konversi / {n.toLocaleString("id-ID")} = {((p as number) * 100).toFixed(2)}%</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat k="z-score" v={z.toFixed(2)} /><Stat k="p-value" v={pval < 0.0001 ? "< 0,0001" : pval.toFixed(4)} tone={sig ? "good" : "bad"} /><Stat k="Kesimpulan (α = 0,05)" v={sig ? "Signifikan" : "Belum signifikan"} tone={sig ? "good" : "bad"} />
      </div>
    </VizFrame>
  );
}
