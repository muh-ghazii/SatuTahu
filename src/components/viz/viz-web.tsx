"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, StepForward } from "lucide-react";
import { Btn, Slider, Stat, VizFrame } from "./Frame";

/* ================= CSS BOX MODEL ================= */
export function BoxModelViz() {
  const [m, setM] = useState(20), [b, setB] = useState(4), [p, setP] = useState(16), [w, setW] = useState(160);
  const [sizing, setSizing] = useState<"content-box" | "border-box">("content-box");
  const total = sizing === "content-box" ? w + 2 * p + 2 * b : w;
  const content = sizing === "content-box" ? w : Math.max(w - 2 * p - 2 * b, 0);
  return (
    <VizFrame
      title="CSS box model"
      caption="Setiap elemen adalah kotak berlapis: content, padding, border, margin. Dengan box-sizing: border-box, width sudah termasuk padding & border, sehingga ukuran lebih mudah diprediksi. Itulah sebabnya banyak proyek memasangnya secara global."
      controls={
        <>
          <Slider label="width" value={w} min={60} max={240} onChange={setW} format={(v) => `${v}px`} />
          <Slider label="padding" value={p} min={0} max={40} onChange={setP} format={(v) => `${v}px`} />
          <Slider label="border" value={b} min={0} max={16} onChange={setB} format={(v) => `${v}px`} />
          <Slider label="margin" value={m} min={0} max={40} onChange={setM} format={(v) => `${v}px`} />
          <Btn active={sizing === "border-box"} onClick={() => setSizing(sizing === "content-box" ? "border-box" : "content-box")}>box-sizing: {sizing}</Btn>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="grid place-items-center overflow-hidden rounded-xl border-2 border-ink bg-paper p-2">
          <div className="relative bg-[#ffd9a8]" style={{ padding: m }}>
            <span className="absolute top-0.5 left-1 text-[9px] font-bold">margin</span>
            <div className="relative border-ink bg-ink" style={{ borderWidth: b, borderStyle: "solid", borderColor: "#12203a" }}>
              <div className="relative bg-[#a7e3bd]" style={{ padding: p }}>
                <span className="absolute top-0.5 left-1 text-[9px] font-bold">padding</span>
                <div className="grid h-16 place-items-center bg-[#9cc3ff] font-mono text-xs font-bold" style={{ width: content }}>{content}px</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Stat k="Lebar tampil (tanpa margin)" v={`${total}px`} />
          <Stat k="Ruang yang dipakai (dengan margin)" v={`${total + 2 * m}px`} />
          <pre className="rounded-lg border-2 border-ink bg-ink p-3 font-mono text-[11.5px] leading-relaxed text-paper">{`.kotak {
  box-sizing: ${sizing};
  width: ${w}px;
  padding: ${p}px;
  border: ${b}px solid;
  margin: ${m}px;
}`}</pre>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= FLEXBOX PLAYGROUND ================= */
export function FlexboxViz() {
  const [dir, setDir] = useState("row");
  const [jc, setJc] = useState("flex-start");
  const [ai, setAi] = useState("stretch");
  const [gap, setGap] = useState(8);
  const [wrap, setWrap] = useState(false);
  const sel = (label: string, v: string, set: (s: string) => void, opts: string[]) => (
    <label className="flex flex-col text-[11px] font-bold">{label}
      <select value={v} onChange={(e) => set(e.target.value)} className="mt-0.5 rounded-lg border-2 border-ink bg-paper px-2 py-1 font-mono text-xs">{opts.map((o) => <option key={o}>{o}</option>)}</select>
    </label>
  );
  return (
    <VizFrame
      title="Flexbox playground"
      caption="justify-content mengatur sumbu utama (arah flex-direction), align-items mengatur sumbu silang. Saat direction diubah ke column, kedua sumbu ikut bertukar. Inilah sumber kebingungan paling umum."
      controls={
        <>
          {sel("flex-direction", dir, setDir, ["row", "row-reverse", "column", "column-reverse"])}
          {sel("justify-content", jc, setJc, ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"])}
          {sel("align-items", ai, setAi, ["stretch", "flex-start", "center", "flex-end", "baseline"])}
          <Slider label="gap" value={gap} min={0} max={32} onChange={setGap} format={(v) => `${v}px`} />
          <Btn active={wrap} onClick={() => setWrap(!wrap)}>flex-wrap: {wrap ? "wrap" : "nowrap"}</Btn>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
        <div className="h-64 rounded-xl border-2 border-ink bg-paper p-2" style={{ display: "flex", flexDirection: dir as "row", justifyContent: jc, alignItems: ai, gap, flexWrap: wrap ? "wrap" : "nowrap" }}>
          {[48, 72, 56, 64].map((s, i) => (
            <motion.div layout key={i} transition={{ type: "spring", stiffness: 300, damping: 28 }} className="grid place-items-center rounded-lg border-2 border-ink bg-sun-300 font-mono text-sm font-bold" style={{ minWidth: s, minHeight: s * 0.75, padding: 6 }}>{i + 1}</motion.div>
          ))}
        </div>
        <pre className="rounded-lg border-2 border-ink bg-ink p-3 font-mono text-[11.5px] leading-relaxed text-paper">{`.wadah {
  display: flex;
  flex-direction: ${dir};
  justify-content: ${jc};
  align-items: ${ai};
  flex-wrap: ${wrap ? "wrap" : "nowrap"};
  gap: ${gap}px;
}`}</pre>
      </div>
    </VizFrame>
  );
}

/* ================= EVENT LOOP ================= */
const elSteps = [
  { line: 0, stack: ["main()"], api: [], micro: [], macro: [], out: [], note: "Script mulai dieksekusi di call stack." },
  { line: 1, stack: ["main()", "console.log('A')"], api: [], micro: [], macro: [], out: ["A"], note: "console.log sinkron, langsung dicetak." },
  { line: 2, stack: ["main()", "setTimeout(cb, 0)"], api: ["timer 0ms → cb"], micro: [], macro: [], out: ["A"], note: "setTimeout diserahkan ke Web API (timer). Stack tidak menunggu." },
  { line: 3, stack: ["main()", "Promise.then(cb2)"], api: [], micro: ["cb2"], macro: ["cb"], out: ["A"], note: "Timer selesai → cb masuk macrotask queue. Promise sudah resolve → cb2 masuk microtask queue." },
  { line: 4, stack: ["main()", "console.log('D')"], api: [], micro: ["cb2"], macro: ["cb"], out: ["A", "D"], note: "Kode sinkron tetap jalan duluan." },
  { line: -1, stack: [], api: [], micro: ["cb2"], macro: ["cb"], out: ["A", "D"], note: "Stack kosong. Event loop memeriksa: microtask dulu!" },
  { line: 3, stack: ["cb2 → log('C')"], api: [], micro: [], macro: ["cb"], out: ["A", "D", "C"], note: "Semua microtask dikosongkan sebelum macrotask berikutnya." },
  { line: 2, stack: ["cb → log('B')"], api: [], micro: [], macro: [], out: ["A", "D", "C", "B"], note: "Baru kemudian macrotask (setTimeout) dijalankan. Hasil akhir: A, D, C, B." },
];
const elCode = ["// event loop", "console.log('A');", "setTimeout(() => console.log('B'), 0);", "Promise.resolve().then(() => console.log('C'));", "console.log('D');"];
export function EventLoopViz() {
  const [i, setI] = useState(0);
  const s = elSteps[i];
  const Box = ({ title, items, tint }: { title: string; items: string[]; tint: string }) => (
    <div className="rounded-xl border-2 border-ink bg-paper p-2">
      <p className="mb-1.5 text-[10px] font-extrabold tracking-wider text-muted uppercase">{title}</p>
      <div className="flex min-h-9 flex-col-reverse gap-1">
        <AnimatePresence>{items.map((x) => <motion.div key={x} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`rounded-md border-2 border-ink px-2 py-1 font-mono text-[11px] font-bold ${tint}`}>{x}</motion.div>)}</AnimatePresence>
      </div>
    </div>
  );
  return (
    <VizFrame
      title="Event loop JavaScript"
      caption="JavaScript hanya punya satu call stack. Pekerjaan async menunggu di queue, dan event loop baru memindahkannya ketika stack kosong, dengan microtask (Promise) didahulukan dibanding macrotask (setTimeout)."
      controls={<><Btn onClick={() => setI(Math.min(i + 1, elSteps.length - 1))} disabled={i === elSteps.length - 1}><StepForward className="size-3.5" />Langkah</Btn><Btn onClick={() => setI(0)}><RotateCcw className="size-3.5" />Ulang</Btn><span className="ml-auto font-mono text-xs">{i + 1}/{elSteps.length}</span></>}
    >
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <pre className="rounded-xl border-2 border-ink bg-ink p-3 font-mono text-[12px] leading-6 text-paper/60">
          {elCode.map((l, k) => <div key={k} className={k === s.line ? "-mx-3 bg-sun-400/25 px-3 text-paper" : ""}>{l}</div>)}
        </pre>
        <div className="grid grid-cols-2 gap-2">
          <Box title="Call stack" items={s.stack} tint="bg-sun-400" />
          <Box title="Web API" items={s.api} tint="bg-[#e6f0ff]" />
          <Box title="Microtask queue" items={s.micro} tint="bg-[#dff5e7]" />
          <Box title="Macrotask queue" items={s.macro} tint="bg-[#ffd9cf]" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="rounded-lg border-2 border-ink bg-ink px-3 py-1.5 font-mono text-sm text-sun-300">output: {s.out.join(" ") || "—"}</div>
        <p className="text-sm font-semibold">{s.note}</p>
      </div>
    </VizFrame>
  );
}

/* ================= RESPONSIVE ================= */
export function ResponsiveViz() {
  const [w, setW] = useState(900);
  const bp = w < 640 ? "base" : w < 768 ? "sm" : w < 1024 ? "md" : "lg";
  const cols = w < 640 ? 1 : w < 1024 ? 2 : 3;
  return (
    <VizFrame
      title="Breakpoint & tata letak responsif"
      caption="Pendekatan mobile-first: tulis gaya untuk layar kecil dulu, lalu tambahkan media query min-width untuk layar yang lebih lebar. Geser lebar viewport untuk melihat grid berubah 1 → 2 → 3 kolom dan navigasi berubah."
      controls={<Slider label="Lebar viewport" value={w} min={320} max={1280} step={10} onChange={setW} format={(v) => `${v}px`} />}
    >
      <div className="overflow-hidden">
        <div className="mx-auto overflow-hidden rounded-xl border-2 border-ink bg-paper transition-all" style={{ width: `${(w / 1280) * 100}%`, minWidth: 150 }}>
          <div className="flex items-center justify-between border-b-2 border-ink bg-sun-300 px-2 py-1.5">
            <span className="size-4 rounded bg-ink" />
            {w < 768 ? <span className="font-mono text-xs font-bold">☰</span> : <span className="flex gap-1.5">{[1, 2, 3].map((k) => <span key={k} className="h-1.5 w-6 rounded bg-ink/60" />)}</span>}
          </div>
          <div className="grid gap-1.5 p-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: 6 }, (_, k) => <motion.div layout key={k} className="h-10 rounded-md border-2 border-ink bg-sun-100" />)}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat k="Breakpoint aktif" v={bp} tone="warn" />
        <Stat k="Kolom grid" v={cols} />
        <Stat k="Navigasi" v={w < 768 ? "menu ☰" : "tautan"} />
      </div>
    </VizFrame>
  );
}

/* ================= CONTRAST CHECKER ================= */
function lum(hex: string) {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function ContrastViz() {
  const [fg, setFg] = useState("#fec536");
  const [bg, setBg] = useState("#ffffff");
  const L1 = lum(fg), L2 = lum(bg);
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  const pass = (n: number) => (ratio >= n ? "Lolos" : "Gagal");
  return (
    <VizFrame
      title="Pemeriksa kontras warna (WCAG)"
      caption="Rasio kontras minimal 4,5:1 untuk teks normal (AA) dan 3:1 untuk teks besar. Contoh awal: kuning SatuTahu di atas putih hanya ~1,6:1, karena itu teks di situs ini memakai navy, dan kuning dipakai sebagai latar atau aksen."
      controls={
        <>
          <label className="flex items-center gap-2 text-xs font-bold">Teks <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-8 w-10 cursor-pointer rounded border-2 border-ink" /></label>
          <label className="flex items-center gap-2 text-xs font-bold">Latar <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-10 cursor-pointer rounded border-2 border-ink" /></label>
          <Btn onClick={() => { setFg("#12203a"); setBg("#fec536"); }}>Navy di kuning</Btn>
          <Btn onClick={() => { setFg("#fec536"); setBg("#ffffff"); }}>Kuning di putih</Btn>
          <Btn onClick={() => { const t = fg; setFg(bg); setBg(t); }}>Tukar</Btn>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border-2 border-ink p-5" style={{ background: bg, color: fg }}>
          <p className="text-2xl font-extrabold">Judul besar</p>
          <p className="mt-2 text-sm">Teks paragraf normal yang harus mudah dibaca oleh semua orang, termasuk pengguna dengan gangguan penglihatan.</p>
        </div>
        <div className="space-y-2">
          <Stat k="Rasio kontras" v={`${ratio.toFixed(2)} : 1`} tone={ratio >= 4.5 ? "good" : ratio >= 3 ? "warn" : "bad"} />
          <div className="grid grid-cols-2 gap-2">
            <Stat k="AA teks normal (4.5)" v={pass(4.5)} tone={ratio >= 4.5 ? "good" : "bad"} />
            <Stat k="AA teks besar (3)" v={pass(3)} tone={ratio >= 3 ? "good" : "bad"} />
            <Stat k="AAA normal (7)" v={pass(7)} tone={ratio >= 7 ? "good" : "bad"} />
            <Stat k="AAA besar (4.5)" v={pass(4.5)} tone={ratio >= 4.5 ? "good" : "bad"} />
          </div>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= TYPE SCALE ================= */
export function TypeScaleViz() {
  const [base, setBase] = useState(16);
  const [ratio, setRatio] = useState(1.25);
  const names = ["caption", "body", "h4", "h3", "h2", "h1"];
  return (
    <VizFrame
      title="Skala tipografi modular"
      caption="Ukuran huruf dihitung dari ukuran dasar dikali rasio berpangkat (base × rasio^n). Hasilnya hierarki yang konsisten, bukan angka acak. Rasio 1,2–1,25 cocok untuk aplikasi; 1,333–1,5 untuk halaman editorial."
      controls={
        <>
          <Slider label="Ukuran dasar" value={base} min={12} max={20} onChange={setBase} format={(v) => `${v}px`} />
          {[1.125, 1.2, 1.25, 1.333, 1.5].map((r) => <Btn key={r} active={ratio === r} onClick={() => setRatio(r)}>{r}</Btn>)}
        </>
      }
    >
      <div className="space-y-2 rounded-xl border-2 border-ink bg-paper p-4">
        {names.map((n, i) => {
          const size = base * ratio ** (i - 1);
          return (
            <div key={n} className="flex items-baseline gap-4 border-b border-line pb-2 last:border-0">
              <span className="w-24 shrink-0 font-mono text-[11px] text-muted">{n} · {size.toFixed(1)}px</span>
              <span className="truncate font-extrabold" style={{ fontSize: size, lineHeight: 1.2 }}>Belajar desain</span>
            </div>
          );
        })}
      </div>
    </VizFrame>
  );
}

/* ================= GIT GRAPH ================= */
type Commit = { id: number; branch: string; parents: number[] };
export function GitGraphViz() {
  const init: Commit[] = [{ id: 1, branch: "main", parents: [] }, { id: 2, branch: "main", parents: [1] }];
  const [commits, setCommits] = useState<Commit[]>(init);
  const [heads, setHeads] = useState<Record<string, number>>({ main: 2 });
  const [cur, setCur] = useState("main");
  const [log, setLog] = useState<string[]>(["git init", "git commit -m \"awal\"", "git commit -m \"fitur dasar\""]);
  const branches = Object.keys(heads);
  const lane = (b: string) => branches.indexOf(b);
  const commit = () => {
    const id = commits.length + 1;
    setCommits([...commits, { id, branch: cur, parents: [heads[cur]] }]);
    setHeads({ ...heads, [cur]: id });
    setLog([...log, `git commit -m "perubahan ${id}"`]);
  };
  const branch = () => {
    const name = cur === "main" ? (heads["fitur-login"] ? "perbaikan-bug" : "fitur-login") : "eksperimen";
    if (heads[name]) return;
    setHeads({ ...heads, [name]: heads[cur] });
    setCur(name);
    setLog([...log, `git switch -c ${name}`]);
  };
  const merge = () => {
    if (cur === "main") return;
    const id = commits.length + 1;
    setCommits([...commits, { id, branch: "main", parents: [heads.main, heads[cur]] }]);
    setLog([...log, "git switch main", `git merge ${cur}`]);
    setHeads({ ...heads, main: id });
    setCur("main");
  };
  const pos = (c: Commit) => ({ x: 30 + (c.id - 1) * 56, y: 30 + lane(c.branch) * 52 });
  const colors = ["#12203a", "#f5b316", "#2fb36b", "#d9534f"];
  return (
    <VizFrame
      title="Simulasi branch & merge Git"
      caption="Setiap commit adalah snapshot yang menunjuk ke commit induknya. Branch hanyalah penunjuk (pointer) ke sebuah commit, sehingga membuatnya sangat murah. Merge commit punya dua induk."
      controls={
        <>
          <span className="rounded-md bg-ink px-2 py-1 font-mono text-xs text-sun-300">HEAD → {cur}</span>
          <Btn onClick={commit}>git commit</Btn>
          <Btn onClick={branch}>git switch -c (branch baru)</Btn>
          {branches.filter((b) => b !== cur).map((b) => <Btn key={b} onClick={() => { setCur(b); setLog([...log, `git switch ${b}`]); }}>switch {b}</Btn>)}
          <Btn onClick={merge} disabled={cur === "main"}>merge ke main</Btn>
          <Btn title="Ulang dari awal" onClick={() => { setCommits(init); setHeads({ main: 2 }); setCur("main"); setLog(["git init"]); }}><RotateCcw className="size-3.5" /></Btn>
        </>
      }
    >
      <div className="overflow-x-auto rounded-xl border-2 border-ink bg-paper">
        <svg width={Math.max(400, 60 + commits.length * 56)} height={30 + branches.length * 52}>
          {commits.flatMap((c) => c.parents.map((p) => {
            const a = pos(commits[p - 1]), b = pos(c);
            return <path key={`${c.id}-${p}`} d={`M${a.x},${a.y} C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x},${b.y}`} fill="none" stroke={colors[lane(c.branch) % 4]} strokeWidth={3} />;
          }))}
          {commits.map((c) => {
            const p = pos(c);
            return <g key={c.id}><circle cx={p.x} cy={p.y} r={c.parents.length > 1 ? 12 : 10} fill={Object.values(heads).includes(c.id) ? "#fec536" : "#fff"} stroke={colors[lane(c.branch) % 4]} strokeWidth={3} /><text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={10} fontWeight={700}>{c.id}</text></g>;
          })}
          {branches.map((b) => { const p = pos(commits[heads[b] - 1]); return <text key={b} x={p.x + 16} y={p.y - 12} fontSize={11} fontWeight={800} fill={colors[lane(b) % 4]}>{b}{b === cur ? " (HEAD)" : ""}</text>; })}
        </svg>
      </div>
      <pre className="mt-3 max-h-28 overflow-y-auto rounded-lg border-2 border-ink bg-ink p-3 font-mono text-[11.5px] text-paper/80">{log.map((l) => `$ ${l}`).join("\n")}</pre>
    </VizFrame>
  );
}

/* ================= JWT ================= */
function b64url(o: object) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
export function JwtViz() {
  const [sub, setSub] = useState("mhs-2201");
  const [role, setRole] = useState("mahasiswa");
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { sub, role, iat: 1795180000, exp: 1795183600 };
  const h = b64url(header), p = b64url(payload);
  const sig = useMemo(() => {
    let x = 0;
    for (const c of h + p + "rahasia-server") x = (x * 33 + c.charCodeAt(0)) >>> 0;
    return (x.toString(36) + "Qx9" + (x * 7).toString(36) + "kP2" + (x * 13).toString(36)).slice(0, 43);
  }, [h, p]);
  return (
    <VizFrame
      title="Anatomi JSON Web Token"
      caption="JWT = header.payload.signature, masing-masing Base64URL. Payload hanya di-encode, BUKAN dienkripsi: siapa pun bisa membacanya, jadi jangan simpan password atau data sensitif di dalamnya. Signature (di sini disimulasikan) mencegah payload diubah tanpa ketahuan."
      controls={
        <>
          <label className="text-xs font-bold">sub <input value={sub} onChange={(e) => setSub(e.target.value)} className="ml-1 w-28 rounded-lg border-2 border-ink px-2 py-1 font-mono text-xs" /></label>
          <label className="text-xs font-bold">role <select value={role} onChange={(e) => setRole(e.target.value)} className="ml-1 rounded-lg border-2 border-ink px-2 py-1 font-mono text-xs"><option>mahasiswa</option><option>dosen</option><option>admin</option></select></label>
        </>
      }
    >
      <p className="rounded-xl border-2 border-ink bg-paper p-3 font-mono text-[12px] leading-relaxed break-all">
        <span className="text-[#d9534f]">{h}</span>.<span className="text-[#7b4cc2]">{p}</span>.<span className="text-[#1f8a8a]">{sig}</span>
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {[["Header", header, "#d9534f"], ["Payload (klaim)", payload, "#7b4cc2"], ["Signature", "HMACSHA256(header + '.' + payload, secret)", "#1f8a8a"]].map(([t, v, c]) => (
          <div key={t as string} className="rounded-xl border-2 border-ink bg-paper p-3">
            <p className="text-xs font-extrabold" style={{ color: c as string }}>{t as string}</p>
            <pre className="mt-1 font-mono text-[11px] whitespace-pre-wrap">{typeof v === "string" ? v : JSON.stringify(v, null, 2)}</pre>
          </div>
        ))}
      </div>
    </VizFrame>
  );
}

/* ================= LOAD BALANCER ================= */
export function LoadBalancerViz() {
  const [algo, setAlgo] = useState<"rr" | "least">("rr");
  const [down, setDown] = useState<boolean[]>([false, false, false]);
  const [load, setLoad] = useState([0, 0, 0]);
  const [served, setServed] = useState([0, 0, 0]);
  const [rr, setRr] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [dropped, setDropped] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLoad((l) => l.map((x) => Math.max(0, x - 1))), 700);
    return () => clearInterval(id);
  }, []);
  const send = () => {
    const alive = [0, 1, 2].filter((i) => !down[i]);
    if (!alive.length) { setDropped((d) => d + 1); setLast(null); return; }
    let t: number;
    if (algo === "rr") { let k = rr; do { k = (k + 1) % 3; } while (down[k]); t = k; setRr(k); }
    else t = alive.reduce((a, b) => (load[b] < load[a] ? b : a));
    setLoad((l) => l.map((x, i) => (i === t ? x + 1 + Math.floor(Math.random() * 3) : x)));
    setServed((s) => s.map((x, i) => (i === t ? x + 1 : x)));
    setLast(t);
  };
  return (
    <VizFrame
      title="Load balancer"
      caption="Load balancer membagi request ke beberapa server. Round-robin bergiliran; least-connections memilih server paling longgar. Matikan satu server: health check membuat trafik otomatis dialihkan, sehingga pengguna tidak merasakan gangguan."
      controls={
        <>
          <Btn active={algo === "rr"} onClick={() => setAlgo("rr")}>Round-robin</Btn>
          <Btn active={algo === "least"} onClick={() => setAlgo("least")}>Least connections</Btn>
          <Btn onClick={send}>Kirim request</Btn>
          <Btn onClick={() => { for (let i = 0; i < 6; i++) setTimeout(send, i * 120); }}>Kirim 6×</Btn>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-xl border-2 border-ink bg-ink px-4 py-2 text-sm font-extrabold text-sun-300">Load Balancer</div>
        <div className="grid w-full grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} animate={{ scale: last === i ? [1, 1.06, 1] : 1 }} className={`rounded-xl border-2 border-ink p-3 text-center ${down[i] ? "bg-cream opacity-60" : "bg-paper"}`}>
              <p className="text-sm font-extrabold">Server {i + 1}</p>
              <div className="mx-auto mt-2 h-2 overflow-hidden rounded-full border border-ink bg-cream"><div className="h-full bg-sun-400 transition-all" style={{ width: `${Math.min(load[i] * 12, 100)}%` }} /></div>
              <p className="mt-1 font-mono text-[11px] text-muted">beban {load[i]} · dilayani {served[i]}</p>
              <button onClick={() => setDown((d) => d.map((x, k) => (k === i ? !x : x)))} className={`mt-2 rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-bold ${down[i] ? "bg-[#ffe4dc]" : "bg-[#dff5e7]"}`}>{down[i] ? "MATI · nyalakan" : "SEHAT · matikan"}</button>
            </motion.div>
          ))}
        </div>
        {dropped > 0 && <p className="text-sm font-bold text-[#d9534f]">{dropped} request gagal karena semua server mati.</p>}
      </div>
    </VizFrame>
  );
}

/* ================= CACHE LRU ================= */
export function CacheViz() {
  const [cap, setCap] = useState(3);
  const [cache, setCache] = useState<string[]>([]);
  const [stats, setStats] = useState({ hit: 0, miss: 0 });
  const [last, setLast] = useState<{ k: string; hit: boolean } | null>(null);
  const keys = ["/produk/1", "/produk/2", "/produk/3", "/produk/4", "/beranda"];
  const get = (k: string) => {
    const hit = cache.includes(k);
    let next = cache.filter((x) => x !== k);
    next = [k, ...next].slice(0, cap);
    setCache(next);
    setStats((s) => ({ hit: s.hit + (hit ? 1 : 0), miss: s.miss + (hit ? 0 : 1) }));
    setLast({ k, hit });
  };
  const total = stats.hit + stats.miss;
  return (
    <VizFrame
      title="Cache dengan kebijakan LRU"
      caption="Cache menyimpan hasil yang sering diminta di memori cepat. Cache hit ≈ 1 ms, miss harus ke database (≈ 50 ms). Saat penuh, item yang paling lama tidak dipakai (Least Recently Used) dibuang."
      controls={<><Slider label="Kapasitas cache" value={cap} min={1} max={5} onChange={(v) => { setCap(v); setCache((c) => c.slice(0, v)); }} />{keys.map((k) => <Btn key={k} onClick={() => get(k)}>GET {k}</Btn>)}</>}
    >
      <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border-2 border-ink bg-paper p-3">
          <p className="mb-2 text-[10px] font-extrabold tracking-wider text-muted uppercase">Isi cache (kiri = paling baru dipakai)</p>
          <div className="flex min-h-11 flex-wrap gap-1.5">
            <AnimatePresence>{cache.map((k) => <motion.span layout key={k} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }} className={`rounded-md border-2 border-ink px-2 py-1 font-mono text-xs font-bold ${last?.k === k ? "bg-sun-400" : "bg-sun-100"}`}>{k}</motion.span>)}</AnimatePresence>
            {Array.from({ length: cap - cache.length }, (_, i) => <span key={`e${i}`} className="rounded-md border-2 border-dashed border-ink/25 px-6 py-1" />)}
          </div>
          {last && <p className={`mt-3 text-sm font-bold ${last.hit ? "text-[#1f8a4c]" : "text-[#d9534f]"}`}>{last.hit ? `HIT: ${last.k} diambil dari cache (~1 ms)` : `MISS: ${last.k} diambil dari database (~50 ms) lalu disimpan`}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 self-start">
          <Stat k="Hit" v={stats.hit} tone="good" /><Stat k="Miss" v={stats.miss} tone="bad" />
          <Stat k="Hit rate" v={total ? `${Math.round((stats.hit / total) * 100)}%` : "—"} />
          <Stat k="Rata-rata latensi" v={total ? `${((stats.hit * 1 + stats.miss * 50) / total).toFixed(1)} ms` : "—"} />
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= SQL JOIN ================= */
const mhs = [{ id: 1, nama: "Ayu" }, { id: 2, nama: "Bima" }, { id: 3, nama: "Citra" }, { id: 4, nama: "Dodi" }];
const krs = [{ mhs_id: 1, mk: "Basis Data" }, { mhs_id: 1, mk: "Jaringan" }, { mhs_id: 3, mk: "AI" }, { mhs_id: 5, mk: "Statistika" }];
export function SqlJoinViz() {
  const [type, setType] = useState<"INNER" | "LEFT" | "RIGHT" | "FULL">("INNER");
  const rows = useMemo(() => {
    const out: { id: string; nama: string; mk: string }[] = [];
    const matchedK = new Set<number>();
    for (const m of mhs) {
      const ks = krs.filter((k, i) => k.mhs_id === m.id && matchedK.add(i));
      if (ks.length) ks.forEach((k) => out.push({ id: String(m.id), nama: m.nama, mk: k.mk }));
      else if (type === "LEFT" || type === "FULL") out.push({ id: String(m.id), nama: m.nama, mk: "NULL" });
    }
    if (type === "RIGHT" || type === "FULL") krs.forEach((k, i) => { if (!matchedK.has(i)) out.push({ id: "NULL", nama: "NULL", mk: k.mk }); });
    if (type === "RIGHT") return out.filter((r) => r.mk !== "NULL");
    return out;
  }, [type]);
  const fillL = type === "LEFT" || type === "FULL", fillR = type === "RIGHT" || type === "FULL";
  return (
    <VizFrame
      title="Jenis JOIN pada SQL"
      caption="INNER JOIN hanya baris yang cocok di kedua tabel. LEFT JOIN mempertahankan semua baris tabel kiri (yang tak punya pasangan diisi NULL). Perhatikan: Dodi tidak mengambil KRS, dan mhs_id 5 tidak ada di tabel mahasiswa."
      controls={<>{(["INNER", "LEFT", "RIGHT", "FULL"] as const).map((t) => <Btn key={t} active={type === t} onClick={() => setType(t)}>{t} JOIN</Btn>)}</>}
    >
      <div className="grid items-center gap-4 md:grid-cols-[180px_1fr]">
        <svg viewBox="0 0 180 110" className="w-full">
          <defs><clipPath id="cl"><circle cx="70" cy="55" r="45" /></clipPath></defs>
          <circle cx="70" cy="55" r="45" fill={fillL ? "#fec536" : "#fff"} stroke="#12203a" strokeWidth="2.5" />
          <circle cx="110" cy="55" r="45" fill={fillR ? "#fec536" : "#fff"} fillOpacity={fillR ? 1 : 0} stroke="#12203a" strokeWidth="2.5" />
          <circle cx="110" cy="55" r="45" fill="#f5b316" clipPath="url(#cl)" />
          <circle cx="70" cy="55" r="45" fill="none" stroke="#12203a" strokeWidth="2.5" />
          <text x="40" y="58" fontSize="11" fontWeight="800">mhs</text><text x="122" y="58" fontSize="11" fontWeight="800">krs</text>
        </svg>
        <div>
          <pre className="mb-2 rounded-lg border-2 border-ink bg-ink p-2.5 font-mono text-[11.5px] text-paper">{`SELECT m.id, m.nama, k.mk
FROM mahasiswa m
${type} JOIN krs k ON k.mhs_id = m.id;`}</pre>
          <div className="overflow-hidden rounded-lg border-2 border-ink bg-paper">
            <table className="w-full font-mono text-xs">
              <thead className="bg-sun-100"><tr>{["id", "nama", "mk"].map((h) => <th key={h} className="px-2 py-1 text-left">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r, i) => <motion.tr key={type + i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-t border-line">{[r.id, r.nama, r.mk].map((v, k) => <td key={k} className={`px-2 py-1 ${v === "NULL" ? "text-[#d9534f] italic" : ""}`}>{v}</td>)}</motion.tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
