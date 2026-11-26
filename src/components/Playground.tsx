"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Code2, Monitor, Play, RotateCcw, Smartphone, Sparkles, Tablet, Terminal, Trophy } from "lucide-react";
import { recordStudyAction } from "@/lib/gamification";

type WebPreset = {
  id: string;
  label: string;
  desc: string;
  html: string;
  css: string;
  js: string;
};

type JsChallenge = {
  id: string;
  title: string;
  level: "Pemula" | "Menengah";
  prompt: string;
  starter: string;
  hint: string;
  fnName: string;
  tests: { args: unknown[]; expected: unknown; label: string }[];
};

const WEB_PRESETS: WebPreset[] = [
  {
    id: "card",
    label: "Kartu Profil",
    desc: "HTML semantik + CSS modern + interaksi tombol",
    html: `<main class="card">
  <span class="badge">Belajar Frontend</span>
  <h1>Halo, saya pembelajar SatuTahu!</h1>
  <p>Coba ubah warna, teks, atau klik tombol di bawah untuk melihat interaksi JS.</p>
  <button id="sapaBtn">Klik untuk menyapa 👋</button>
  <p id="status" class="status"></p>
</main>`,
    css: `* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  font-family: system-ui, sans-serif;
  background: #fdf9ee;
  color: #12203a;
}
.card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border: 2px solid #12203a;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 5px 5px 0 #12203a;
}
.badge {
  display: inline-block;
  background: #fec536;
  border: 1.5px solid #12203a;
  border-radius: 99px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 800;
}
h1 { margin: 12px 0 8px; font-size: 22px; line-height: 1.2; }
p { margin: 0 0 14px; color: #475569; font-size: 14px; line-height: 1.5; }
button {
  width: 100%;
  background: #fec536;
  border: 2px solid #12203a;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 3px 3px 0 #12203a;
}
button:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #12203a; }
.status { margin-top: 12px; font-weight: 700; color: #15803d; }`,
    js: `let klik = 0;
const btn = document.getElementById('sapaBtn');
const status = document.getElementById('status');

btn.addEventListener('click', () => {
  klik++;
  status.textContent = \`Mantap! Kamu sudah menyapa \${klik} kali.\`;
  console.log('Tombol diklik ke-' + klik);
});`,
  },
  {
    id: "grid",
    label: "Katalog Grid UMKM",
    desc: "CSS Grid auto-fill responsif tanpa media query",
    html: `<section class="wrap">
  <h2>Katalog Tahu Spesial</h2>
  <div class="grid">
    <article class="item"><h3>Tahu Krispi</h3><p>Rp 12.000</p></article>
    <article class="item"><h3>Tahu Gejrot</h3><p>Rp 15.000</p></article>
    <article class="item"><h3>Tahu Walik</h3><p>Rp 14.000</p></article>
    <article class="item"><h3>Tahu Isi Pedas</h3><p>Rp 13.000</p></article>
  </div>
</section>`,
    css: `* { box-sizing: border-box; }
body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; background: #fdf9ee; color: #12203a; }
.wrap { max-width: 720px; margin: 0 auto; }
h2 { margin: 0 0 14px; }
.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
.item {
  background: #fff;
  border: 2px solid #12203a;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 3px 3px 0 #12203a;
}
.item h3 { margin: 0 0 6px; font-size: 16px; }
.item p { margin: 0; font-weight: 800; color: #b45309; }`,
    js: `console.log('Coba ubah tombol viewport HP / Tablet / Penuh di atas!');`,
  },
  {
    id: "todo",
    label: "Catatan Mini",
    desc: "Pola state → render dengan vanilla JavaScript",
    html: `<div class="box">
  <h2>Daftar Belajar Hari Ini</h2>
  <form id="f">
    <input id="inp" placeholder="Tambah target..." required />
    <button type="submit">Tambah</button>
  </form>
  <ul id="list"></ul>
</div>`,
    css: `* { box-sizing: border-box; }
body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; background: #fdf9ee; color: #12203a; }
.box { max-width: 420px; margin: 0 auto; background: #fff; border: 2px solid #12203a; border-radius: 16px; padding: 16px; box-shadow: 4px 4px 0 #12203a; }
form { display: flex; gap: 8px; }
input { flex: 1; padding: 8px 10px; border: 2px solid #12203a; border-radius: 10px; }
button { background: #fec536; border: 2px solid #12203a; border-radius: 10px; padding: 8px 12px; font-weight: 800; cursor: pointer; }
ul { list-style: none; padding: 0; margin: 14px 0 0; display: grid; gap: 6px; }
li { padding: 8px 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; }
li.done { text-decoration: line-through; background: #dcfce7; }`,
    js: `const items = [
  { teks: 'Baca modul HTML & CSS', selesai: true },
  { teks: 'Coba Arena Game SatuTahu', selesai: false },
];
const list = document.getElementById('list');
const form = document.getElementById('f');
const inp = document.getElementById('inp');

function render() {
  list.innerHTML = '';
  items.forEach((it, i) => {
    const li = document.createElement('li');
    li.textContent = (it.selesai ? '✓ ' : '○ ') + it.teks;
    if (it.selesai) li.className = 'done';
    li.onclick = () => { items[i].selesai = !items[i].selesai; render(); };
    list.appendChild(li);
  });
}

form.onsubmit = (e) => {
  e.preventDefault();
  items.push({ teks: inp.value.trim(), selesai: false });
  inp.value = '';
  render();
};
render();`,
  },
];

const JS_CHALLENGES: JsChallenge[] = [
  {
    id: "fizzbuzz",
    title: "1. FizzBuzz Klasik",
    level: "Pemula",
    prompt: "Tulis fungsi fizzBuzz(n) yang mengembalikan 'FizzBuzz' jika n kelipatan 3 & 5, 'Fizz' jika kelipatan 3, 'Buzz' jika kelipatan 5, atau angka n (string) jika bukan keduanya.",
    starter: `function fizzBuzz(n) {\n  // Tulis kodemu di sini\n  if (n % 15 === 0) return "FizzBuzz";\n  return String(n);\n}`,
    hint: "Cek n % 15 === 0 dulu, lalu n % 3 === 0, lalu n % 5 === 0, sisanya String(n).",
    fnName: "fizzBuzz",
    tests: [
      { args: [15], expected: "FizzBuzz", label: "fizzBuzz(15) → 'FizzBuzz'" },
      { args: [9], expected: "Fizz", label: "fizzBuzz(9) → 'Fizz'" },
      { args: [10], expected: "Buzz", label: "fizzBuzz(10) → 'Buzz'" },
      { args: [7], expected: "7", label: "fizzBuzz(7) → '7'" },
    ],
  },
  {
    id: "diskon",
    title: "2. Hitung Total Diskon",
    level: "Pemula",
    prompt: "Tulis fungsi hitungBayar(harga, persenDiskon) yang mengembalikan harga akhir setelah dipotong diskon. Jika persenDiskon ≤ 0, kembalikan harga asli.",
    starter: `function hitungBayar(harga, persenDiskon) {\n  // Contoh: hitungBayar(100000, 20) => 80000\n  return harga;\n}`,
    hint: "potongan = harga * (persenDiskon / 100); jika persenDiskon <= 0 kembalikan harga.",
    fnName: "hitungBayar",
    tests: [
      { args: [100000, 20], expected: 80000, label: "hitungBayar(100000, 20) → 80000" },
      { args: [50000, 0], expected: 50000, label: "hitungBayar(50000, 0) → 50000" },
      { args: [200000, 50], expected: 100000, label: "hitungBayar(200000, 50) → 100000" },
    ],
  },
  {
    id: "palindrom",
    title: "3. Cek Palindrom",
    level: "Pemula",
    prompt: "Tulis fungsi isPalindrom(teks) yang mengembalikan true jika teks dibaca sama dari depan maupun belakang (abaikan huruf besar/kecil).",
    starter: `function isPalindrom(teks) {\n  const bersih = teks.toLowerCase();\n  // Bandingkan dengan versi terbaliknya\n  return false;\n}`,
    hint: "Gunakan bersih.split('').reverse().join('') === bersih.",
    fnName: "isPalindrom",
    tests: [
      { args: ["Katak"], expected: true, label: "isPalindrom('Katak') → true" },
      { args: ["Kasur"], expected: false, label: "isPalindrom('Kasur') → false" },
      { args: ["malam"], expected: true, label: "isPalindrom('malam') → true" },
    ],
  },
  {
    id: "filter-genap",
    title: "4. Jumlah Angka Genap",
    level: "Pemula",
    prompt: "Tulis fungsi jumlahGenap(arr) yang menjumlahkan semua angka genap di dalam array angka.",
    starter: `function jumlahGenap(arr) {\n  // Gunakan filter + reduce atau loop for\n  return 0;\n}`,
    hint: "arr.filter(x => x % 2 === 0).reduce((a, b) => a + b, 0)",
    fnName: "jumlahGenap",
    tests: [
      { args: [[1, 2, 3, 4, 5, 6]], expected: 12, label: "jumlahGenap([1..6]) → 12" },
      { args: [[1, 3, 5]], expected: 0, label: "jumlahGenap([1,3,5]) → 0" },
      { args: [[10, 20, 7]], expected: 30, label: "jumlahGenap([10,20,7]) → 30" },
    ],
  },
  {
    id: "frekuensi",
    title: "5. Hitung Frekuensi Kata",
    level: "Menengah",
    prompt: "Tulis fungsi hitungKata(kalimat) yang mengembalikan objek frekuensi setiap kata (lowercase, dipisah spasi). Contoh: 'tahu isi tahu' → { tahu: 2, isi: 1 }.",
    starter: `function hitungKata(kalimat) {\n  const hasil = {};\n  // Pecah kata dengan split(' ') lalu hitung\n  return hasil;\n}`,
    hint: "Untuk setiap kata k dari kalimat.toLowerCase().trim().split(/\\s+/): hasil[k] = (hasil[k] || 0) + 1.",
    fnName: "hitungKata",
    tests: [
      { args: ["tahu isi tahu"], expected: { tahu: 2, isi: 1 }, label: "'tahu isi tahu' → { tahu: 2, isi: 1 }" },
      { args: ["JS js Python"], expected: { js: 2, python: 1 }, label: "'JS js Python' → { js: 2, python: 1 }" },
    ],
  },
];

function buildSrcDoc(html: string, css: string, js: string) {
  const safeJs = js.replace(/<\/script>/gi, "<\\/script>");
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>${css}</style>
</head>
<body>
${html}
<script>
(function(){
  const send = (level, args) => {
    try {
      parent.postMessage({ source: 'satutahu-playground', level, text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
    } catch {}
  };
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => { send('log', a); origLog.apply(console, a); };
  console.error = (...a) => { send('error', a); origErr.apply(console, a); };
  window.onerror = (msg, _s, line) => { send('error', [msg + ' (baris ' + line + ')']); };
})();
</script>
<script>
try {
${safeJs}
} catch (err) {
  console.error(err && err.message ? err.message : String(err));
}
</script>
</body>
</html>`;
}

export function Playground() {
  const [mode, setMode] = useState<"web" | "challenge">("web");

  // Web Lab state
  const [presetId, setPresetId] = useState(WEB_PRESETS[0].id);
  const [html, setHtml] = useState(WEB_PRESETS[0].html);
  const [css, setCss] = useState(WEB_PRESETS[0].css);
  const [js, setJs] = useState(WEB_PRESETS[0].js);
  const [codeTab, setCodeTab] = useState<"html" | "css" | "js">("html");
  const [mobilePane, setMobilePane] = useState<"editor" | "preview" | "console">("editor");
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "full">("full");
  const [runKey, setRunKey] = useState(0);
  const [logs, setLogs] = useState<{ level: "log" | "error"; text: string }[]>([]);

  // JS Challenge state
  const [challengeIdx, setChallengeIdx] = useState(0);
  const challenge = JS_CHALLENGES[challengeIdx];
  const [challengeCode, setChallengeCode] = useState(challenge.starter);
  const [showHint, setShowHint] = useState(false);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ label: string; pass: boolean; actual?: string; err?: string }[] | null>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.source === "satutahu-playground") {
        setLogs((prev) => [...prev.slice(-40), { level: e.data.level === "error" ? "error" : "log", text: String(e.data.text) }]);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const srcDoc = useMemo(() => buildSrcDoc(html, css, js), [html, css, js]);

  const loadPreset = (p: WebPreset) => {
    setPresetId(p.id);
    setHtml(p.html);
    setCss(p.css);
    setJs(p.js);
    setLogs([]);
    setRunKey((k) => k + 1);
  };

  const runWeb = useCallback(() => {
    setLogs([]);
    setRunKey((k) => k + 1);
    setMobilePane("preview");
    recordStudyAction((s) => ({ playgroundRuns: s.playgroundRuns + 1 }), 5);
  }, []);

  const selectChallenge = (idx: number) => {
    setChallengeIdx(idx);
    setChallengeCode(JS_CHALLENGES[idx].starter);
    setTestResults(null);
    setShowHint(false);
  };

  const runChallenge = () => {
    recordStudyAction((s) => ({ playgroundRuns: s.playgroundRuns + 1 }), 5);
    try {
      const factory = new Function(`"use strict";\n${challengeCode}\nreturn typeof ${challenge.fnName} === "function" ? ${challenge.fnName} : null;`);
      const fn = factory();
      if (!fn) {
        setTestResults([{ label: `Fungsi ${challenge.fnName}() tidak ditemukan`, pass: false, err: "Pastikan nama fungsi sesuai soal." }]);
        return;
      }
      const res = challenge.tests.map((t) => {
        try {
          const actual = fn(...t.args);
          const pass = JSON.stringify(actual) === JSON.stringify(t.expected);
          return { label: t.label, pass, actual: JSON.stringify(actual) };
        } catch (err) {
          return { label: t.label, pass: false, err: err instanceof Error ? err.message : String(err) };
        }
      });
      setTestResults(res);
      if (res.every((r) => r.pass) && !solvedIds.includes(challenge.id)) {
        setSolvedIds((prev) => [...prev, challenge.id]);
        recordStudyAction((s) => ({ challengesSolved: s.challengesSolved + 1 }), 40);
      }
    } catch (err) {
      setTestResults([{ label: "Syntax Error", pass: false, err: err instanceof Error ? err.message : String(err) }]);
    }
  };

  const activeEditorValue = codeTab === "html" ? html : codeTab === "css" ? css : js;
  const setActiveEditorValue = (v: string) => {
    if (codeTab === "html") setHtml(v);
    else if (codeTab === "css") setCss(v);
    else setJs(v);
  };

  return (
    <div>
      {/* Mode Switcher */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:inline-flex">
        <button
          type="button"
          onClick={() => setMode("web")}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 text-sm font-extrabold transition-all ${
            mode === "web" ? "bg-sun-400 shadow-hard-sm" : "bg-paper text-muted hover:bg-sun-50 hover:text-ink"
          }`}
        >
          <Code2 className="size-4" /> Web Lab (HTML/CSS/JS)
        </button>
        <button
          type="button"
          onClick={() => setMode("challenge")}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 text-sm font-extrabold transition-all ${
            mode === "challenge" ? "bg-sun-400 shadow-hard-sm" : "bg-paper text-muted hover:bg-sun-50 hover:text-ink"
          }`}
        >
          <Trophy className="size-4" /> Tantangan JS ({solvedIds.length}/{JS_CHALLENGES.length})
        </button>
      </div>

      {mode === "web" ? (
        <div className="space-y-4">
          {/* Bar Preset + Aksi */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-1">
              {WEB_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className={`chip shrink-0 !px-3 !py-1.5 ${presetId === p.id ? "!bg-ink !text-sun-300" : "hover:bg-sun-100"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadPreset(WEB_PRESETS.find((x) => x.id === presetId) ?? WEB_PRESETS[0])}
                className="btn btn-ghost !px-3 !py-2 !text-xs"
              >
                <RotateCcw className="size-3.5" /> Reset
              </button>
              <button type="button" onClick={runWeb} className="btn btn-primary !px-4 !py-2 !text-xs">
                <Play className="size-3.5 fill-current" /> Jalankan (+5 XP)
              </button>
            </div>
          </div>

          {/* Mobile Pane Switcher */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border-2 border-ink bg-paper p-1 lg:hidden">
            {(
              [
                ["editor", "Editor"],
                ["preview", "Preview"],
                ["console", `Console (${logs.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMobilePane(id)}
                className={`rounded-lg py-2 text-xs font-extrabold ${mobilePane === id ? "bg-sun-400 text-ink" : "text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Split View Desktop / Tabbed Mobile */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Editor */}
            <div className={`card overflow-hidden bg-ink text-paper ${mobilePane === "editor" ? "block" : "hidden lg:block"}`}>
              <div className="flex items-center justify-between border-b border-paper/15 bg-ink-2 px-3 py-2">
                <div className="flex gap-1">
                  {(["html", "css", "js"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCodeTab(t)}
                      className={`rounded-lg px-3 py-1 font-mono text-xs font-bold uppercase ${
                        codeTab === t ? "bg-sun-400 text-ink" : "text-paper/70 hover:text-paper"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-[11px] text-paper/50">Live Sandbox</span>
              </div>
              <textarea
                value={activeEditorValue}
                onChange={(e) => setActiveEditorValue(e.target.value)}
                spellCheck={false}
                aria-label={`Editor ${codeTab.toUpperCase()}`}
                className="h-[360px] w-full resize-none bg-ink p-4 font-mono text-[13px] leading-relaxed text-paper outline-none sm:h-[440px]"
              />
            </div>

            {/* Preview + Console */}
            <div className="flex flex-col gap-4">
              <div className={`card overflow-hidden bg-paper ${mobilePane === "preview" ? "block" : "hidden lg:block"}`}>
                <div className="flex items-center justify-between border-b-2 border-ink bg-cream px-3 py-2">
                  <span className="text-xs font-extrabold">Hasil Langsung</span>
                  <div className="hidden items-center gap-1 sm:flex">
                    {(
                      [
                        ["mobile", Smartphone, "375px"],
                        ["tablet", Tablet, "768px"],
                        ["full", Monitor, "Penuh"],
                      ] as const
                    ).map(([vp, Icon, title]) => (
                      <button
                        key={vp}
                        type="button"
                        onClick={() => setViewport(vp)}
                        title={`Tampilan ${title}`}
                        className={`rounded-lg border border-ink/30 p-1.5 ${viewport === vp ? "bg-sun-400" : "bg-paper hover:bg-sun-50"}`}
                      >
                        <Icon className="size-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center bg-[#f3efe4] p-2">
                  <iframe
                    key={runKey}
                    title="Preview kode SatuTahu"
                    sandbox="allow-scripts"
                    srcDoc={srcDoc}
                    style={{
                      width: viewport === "mobile" ? "375px" : viewport === "tablet" ? "100%" : "100%",
                      maxWidth: viewport === "tablet" ? "540px" : "100%",
                    }}
                    className="h-[320px] rounded-lg border border-ink/20 bg-white transition-all sm:h-[340px]"
                  />
                </div>
              </div>

              <div className={`card overflow-hidden bg-ink text-paper ${mobilePane === "console" ? "block" : "hidden lg:block"}`}>
                <div className="flex items-center justify-between border-b border-paper/15 bg-ink-2 px-3 py-1.5">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-sun-300">
                    <Terminal className="size-3.5" /> CONSOLE
                  </span>
                  <button type="button" onClick={() => setLogs([])} className="font-mono text-[11px] text-paper/60 hover:text-paper">
                    Bersihkan
                  </button>
                </div>
                <div className="h-[110px] overflow-y-auto p-3 font-mono text-xs leading-relaxed">
                  {logs.length === 0 ? (
                    <p className="text-paper/45">Output console.log() dan error akan muncul di sini…</p>
                  ) : (
                    logs.map((l, i) => (
                      <p key={i} className={l.level === "error" ? "text-[#ff8577]" : "text-[#7ee787]"}>
                        {l.level === "error" ? "✗ " : "› "}
                        {l.text}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mode Tantangan JavaScript dengan Autograder */
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {JS_CHALLENGES.map((c, idx) => {
              const solved = solvedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChallenge(idx)}
                  className={`flex shrink-0 items-center justify-between gap-2 rounded-xl border-2 border-ink px-3.5 py-2.5 text-left text-xs font-extrabold transition-all sm:text-sm ${
                    idx === challengeIdx ? "bg-sun-400 shadow-hard-sm" : "bg-paper hover:bg-sun-50"
                  }`}
                >
                  <span>{c.title}</span>
                  {solved && <CheckCircle2 className="size-4 shrink-0 text-[#1d7a46]" />}
                </button>
              );
            })}
          </div>

          <div className="card overflow-hidden bg-paper">
            <div className="border-b-2 border-ink bg-sun-100 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="chip !bg-paper">{challenge.level}</span>
                <span className="chip !bg-[#dff5e7]"><Sparkles className="size-3" /> +40 XP jika semua tes lulus</span>
              </div>
              <h2 className="mt-2 text-lg font-extrabold sm:text-xl">{challenge.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{challenge.prompt}</p>
            </div>

            <div className="bg-ink p-3 sm:p-4">
              <textarea
                value={challengeCode}
                onChange={(e) => setChallengeCode(e.target.value)}
                spellCheck={false}
                aria-label="Editor Tantangan JavaScript"
                className="h-[220px] w-full resize-none bg-ink font-mono text-[13.5px] leading-relaxed text-paper outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink bg-cream p-3.5 sm:px-5">
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowHint((h) => !h)} className="btn btn-ghost !px-3 !py-2 !text-xs">
                  {showHint ? "Sembunyikan Petunjuk" : "Lihat Petunjuk"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChallengeCode(challenge.starter);
                    setTestResults(null);
                  }}
                  className="btn btn-ghost !px-3 !py-2 !text-xs"
                >
                  <RotateCcw className="size-3.5" /> Reset
                </button>
              </div>
              <button type="button" onClick={runChallenge} className="btn btn-primary !px-5 !py-2 !text-xs">
                <Play className="size-3.5 fill-current" /> Uji Jawaban
              </button>
            </div>

            {showHint && (
              <div className="border-t-2 border-dashed border-line bg-sun-50 px-5 py-3 text-xs leading-relaxed text-ink-2">
                <span className="font-extrabold text-ink">Petunjuk: </span>
                {challenge.hint}
              </div>
            )}

            {testResults && (
              <div className="border-t-2 border-ink p-4 sm:p-5">
                <p className="text-xs font-extrabold tracking-wider uppercase">
                  Hasil Uji: {testResults.filter((r) => r.pass).length}/{testResults.length} Lulus
                </p>
                <ul className="mt-3 space-y-2">
                  {testResults.map((r, i) => (
                    <li
                      key={i}
                      className={`rounded-xl border-2 px-3.5 py-2 font-mono text-xs ${
                        r.pass ? "border-ink bg-[#dff5e7] text-ink" : "border-ink bg-[#ffe4dc] text-ink"
                      }`}
                    >
                      <span className="font-extrabold">{r.pass ? "✓ LULUS" : "✗ GAGAL"}</span> · {r.label}
                      {!r.pass && r.actual !== undefined && <span className="block text-[11px] text-ink-2">Outputmu: {r.actual}</span>}
                      {r.err && <span className="block text-[11px] text-[#b4362c]">{r.err}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
