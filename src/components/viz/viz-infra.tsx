"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Btn, Slider, Stat, VizFrame } from "./Frame";

/* ================= SUBNET / CIDR ================= */
const ipToInt = (ip: string) => ip.split(".").reduce((a, o) => (a << 8) + (Number(o) & 255), 0) >>> 0;
const intToIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
export function SubnetViz() {
  const [ip, setIp] = useState("192.168.10.77");
  const [prefix, setPrefix] = useState(26);
  const valid = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split(".").every((o) => Number(o) <= 255);
  const n = valid ? ipToInt(ip) : 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const net = (n & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
  const hosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : 2 ** (32 - prefix) - 2;
  const bits = n.toString(2).padStart(32, "0");
  return (
    <VizFrame
      title="Kalkulator subnet (CIDR)"
      caption="Prefix /n berarti n bit pertama adalah bagian network (kuning), sisanya bagian host. Setiap tambah 1 bit network, jumlah host per subnet berkurang setengah. Alamat pertama = network address, terakhir = broadcast; keduanya tidak bisa dipakai host."
      controls={<><label className="text-xs font-bold">Alamat IP <input value={ip} onChange={(e) => setIp(e.target.value)} className={`ml-1 w-36 rounded-lg border-2 px-2 py-1 font-mono text-sm ${valid ? "border-ink" : "border-[#d9534f]"}`} /></label><Slider label="Prefix" value={prefix} min={8} max={32} onChange={setPrefix} format={(v) => `/${v}`} /></>}
    >
      <div className="overflow-x-auto">
        <div className="flex min-w-[520px] gap-1 font-mono text-[11px]">
          {[0, 1, 2, 3].map((o) => (
            <div key={o} className="flex gap-px">
              {bits.slice(o * 8, o * 8 + 8).split("").map((b, i) => <span key={i} className={`grid h-7 w-4 place-items-center rounded-sm border border-ink/40 font-bold ${o * 8 + i < prefix ? "bg-sun-400" : "bg-[#cfe3ff]"}`}>{b}</span>)}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat k="Subnet mask" v={intToIp(mask)} /><Stat k="Network address" v={`${intToIp(net)}/${prefix}`} /><Stat k="Broadcast" v={intToIp(bc)} />
        <Stat k="Host pertama" v={prefix >= 31 ? "—" : intToIp(net + 1)} /><Stat k="Host terakhir" v={prefix >= 31 ? "—" : intToIp(bc - 1)} /><Stat k="Jumlah host" v={hosts.toLocaleString("id-ID")} tone="warn" />
      </div>
    </VizFrame>
  );
}

/* ================= HASH SHA-256 ================= */
async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function HashViz() {
  const [a, setA] = useState("password123");
  const [b, setB] = useState("password124");
  const [ha, setHa] = useState(""), [hb, setHb] = useState("");
  useEffect(() => { sha256(a).then(setHa).catch(() => setHa("(crypto tidak tersedia)")); }, [a]);
  useEffect(() => { sha256(b).then(setHb).catch(() => setHb("")); }, [b]);
  const diff = ha && hb ? [...ha].filter((c, i) => c !== hb[i]).length : 0;
  return (
    <VizFrame
      title="Fungsi hash SHA-256 (dihitung langsung di browsermu)"
      hint="Ketik teks"
      caption="Hash bersifat satu arah dan deterministik: input sama → hash sama, tetapi perubahan satu karakter mengubah hampir seluruh output (avalanche effect). Untuk password, SHA-256 polos terlalu cepat sehingga mudah ditebak secara brute force. Gunakan algoritma lambat + salt seperti Argon2 atau bcrypt."
    >
      {[[a, setA, ha], [b, setB, hb]].map(([v, set, h], k) => (
        <div key={k} className="mb-3">
          <input aria-label={`Teks ${k + 1} yang di-hash`} value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 font-mono text-sm" />
          <p className="mt-1 rounded-lg border-2 border-ink bg-ink p-2 font-mono text-[11px] break-all">
            {(h as string).split("").map((c, i) => <span key={i} className={k === 1 && ha[i] !== c ? "text-sun-400" : "text-paper/70"}>{c}</span>)}
          </p>
        </div>
      ))}
      <Stat k="Karakter hex yang berbeda" v={`${diff} dari 64`} tone="warn" />
    </VizFrame>
  );
}

/* ================= CIPHER: Caesar & XOR ================= */
export function CipherViz() {
  const [text, setText] = useState("SERANG FAJAR");
  const [shift, setShift] = useState(3);
  const enc = text.toUpperCase().replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65));
  const freq = Array.from({ length: 26 }, (_, i) => enc.split("").filter((c) => c.charCodeAt(0) === 65 + i).length);
  const maxF = Math.max(...freq, 1);
  return (
    <VizFrame
      title="Enkripsi simetris paling sederhana: Caesar cipher"
      caption="Kunci = jumlah geseran; pengirim dan penerima memakai kunci yang sama (simetris). Caesar mudah dipecahkan: hanya 25 kemungkinan kunci, dan pola frekuensi huruf tetap terlihat (lihat grafik). Algoritma modern seperti AES memakai kunci 128–256 bit, sehingga mencoba semua kemungkinannya mustahil."
      controls={<><input aria-label="Teks yang dienkripsi" value={text} onChange={(e) => setText(e.target.value)} className="w-48 rounded-lg border-2 border-ink bg-paper px-2 py-1 font-mono text-sm" /><Slider label="Kunci (geser)" value={shift} min={0} max={25} onChange={setShift} /></>}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <Stat k="Plaintext" v={text.toUpperCase()} /><Stat k="Ciphertext" v={enc} tone="warn" />
      </div>
      <div className="mt-3 flex font-mono text-[10px]">
        {Array.from({ length: 26 }, (_, i) => <div key={i} className="flex flex-1 flex-col items-center"><span className="font-bold">{String.fromCharCode(65 + i)}</span><span>↓</span><span className="font-bold text-ink-3">{String.fromCharCode(((i + shift) % 26) + 65)}</span></div>)}
      </div>
      <div className="mt-3 flex h-16 items-end gap-px rounded-lg border-2 border-ink bg-paper p-1">
        {freq.map((f, i) => <div key={i} className="flex-1 rounded-t-sm bg-sun-400" style={{ height: `${(f / maxF) * 100}%` }} title={String.fromCharCode(65 + i)} />)}
      </div>
    </VizFrame>
  );
}

/* ================= PASSWORD ENTROPY ================= */
export function EntropyViz() {
  const [pw, setPw] = useState("kucing123");
  const pool = (/[a-z]/.test(pw) ? 26 : 0) + (/[A-Z]/.test(pw) ? 26 : 0) + (/\d/.test(pw) ? 10 : 0) + (/[^a-zA-Z0-9]/.test(pw) ? 33 : 0);
  const bits = pw.length * Math.log2(Math.max(pool, 1));
  const guesses = 2 ** bits;
  const fmt = (s: number) => s < 1 ? "seketika" : s < 3600 ? `${Math.round(s / 60)} menit` : s < 86400 * 365 ? `${Math.round(s / 86400)} hari` : s < 86400 * 365 * 1e6 ? `${Math.round(s / (86400 * 365)).toLocaleString("id-ID")} tahun` : "> sejuta tahun";
  const common = /^(password|123456|qwerty|admin|kucing|sayang|bismillah)/i.test(pw);
  return (
    <VizFrame
      title="Seberapa kuat sebuah password?"
      hint="Ketik password contoh"
      caption="Estimasi kasar: entropi = panjang × log₂(jumlah jenis karakter). Waktu tebak dihitung untuk serangan offline 10 miliar tebakan/detik terhadap hash cepat. Panjang lebih berpengaruh daripada simbol: frasa 4–5 kata acak lebih kuat dan lebih mudah diingat. Jangan ketik password aslimu di situs mana pun, termasuk demo ini."
      controls={<input aria-label="Password untuk diuji" type="text" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 font-mono text-sm" />}
    >
      <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-cream"><motion.div className={`h-full ${bits < 40 ? "bg-[#d9534f]" : bits < 70 ? "bg-sun-400" : "bg-[#2fb36b]"}`} animate={{ width: `${Math.min(bits / 100, 1) * 100}%` }} /></div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat k="Panjang" v={pw.length} /><Stat k="Ragam karakter" v={pool} /><Stat k="Entropi" v={`${bits.toFixed(0)} bit`} /><Stat k="Waktu tebak" v={common ? "seketika (ada di kamus)" : fmt(guesses / 1e10 / 2)} tone={common || bits < 40 ? "bad" : bits < 70 ? "warn" : "good"} />
      </div>
    </VizFrame>
  );
}

/* ================= SQL INJECTION (tanpa eksekusi) ================= */
export function SqliViz() {
  const [user, setUser] = useState("budi");
  const [safe, setSafe] = useState(false);
  const query = `SELECT * FROM users WHERE username = '${user}' AND password = '***';`;
  const broken = !safe && /'/.test(user);
  return (
    <VizFrame
      title="SQL injection: kenapa string tidak boleh digabung langsung"
      hint="Ubah input"
      caption="Jika input digabung ke string SQL, tanda kutip dari pengguna bisa mengubah struktur query. Coba contoh klasik di bawah. Dengan parameterized query, input selalu diperlakukan sebagai data, bukan kode. Demo ini hanya menampilkan string query; tidak ada database yang dijalankan."
      controls={<><input aria-label="Input email/username login" value={user} onChange={(e) => setUser(e.target.value)} className="w-56 rounded-lg border-2 border-ink bg-paper px-2 py-1 font-mono text-sm" /><Btn onClick={() => setUser("' OR '1'='1' --")}>Contoh input berbahaya</Btn><Btn active={safe} onClick={() => setSafe(!safe)}>Parameterized: {safe ? "ON" : "OFF"}</Btn></>}
    >
      {safe ? (
        <pre className="rounded-xl border-2 border-ink bg-ink p-3 font-mono text-[12px] whitespace-pre-wrap text-paper">{`db.query(
  "SELECT * FROM users WHERE username = ? AND password_hash = ?",
  [${JSON.stringify(user)}, hash]   // ← nilai dikirim terpisah dari query
)`}</pre>
      ) : (
        <pre className="rounded-xl border-2 border-ink bg-ink p-3 font-mono text-[12px] whitespace-pre-wrap text-paper">
          {query.split(user).map((part, i, arr) => <span key={i}>{part}{i < arr.length - 1 && <span className={broken ? "bg-[#d9534f] text-paper" : "bg-sun-400/30"}>{user}</span>}</span>)}
        </pre>
      )}
      <p className={`mt-3 rounded-lg border-2 border-ink p-3 text-sm font-semibold ${safe ? "bg-[#dff5e7]" : broken ? "bg-[#ffe4dc]" : "bg-paper"}`}>
        {safe ? "Aman: driver database mengirim nilai sebagai parameter, jadi tanda kutip tidak bisa keluar dari ‘kotak data’." : broken ? "Berbahaya: kutip dari input menutup string lebih awal. ‘OR 1=1’ selalu benar dan ‘--’ mengomentari sisa query, sehingga cek password terlewati." : "Input normal, tapi pola kodenya tetap rentan. Coba contoh input berbahaya."}
      </p>
    </VizFrame>
  );
}

/* ================= XSS (tanpa eksekusi) ================= */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export function XssViz() {
  const [c, setC] = useState("Materinya bagus!");
  const [escape, setEscape] = useState(false);
  const html = `<p class="komentar">${escape ? esc(c) : c}</p>`;
  const danger = !escape && /<\s*(script|img|svg|iframe)|on\w+\s*=/i.test(c);
  return (
    <VizFrame
      title="Cross-Site Scripting: output harus di-escape"
      hint="Ubah komentar"
      caption="Jika komentar pengguna dimasukkan ke HTML apa adanya, browser pengunjung lain akan menjalankan tag yang disisipkan sebagai kode, misalnya untuk mencuri cookie session. Escaping mengubah < menjadi &lt; sehingga tampil sebagai teks. React/Next.js meng-escape otomatis, kecuali saat kamu memakai dangerouslySetInnerHTML. Demo ini hanya menampilkan string HTML; tidak ada kode yang dijalankan."
      controls={<><input aria-label="Isi komentar" value={c} onChange={(e) => setC(e.target.value)} className="w-64 rounded-lg border-2 border-ink bg-paper px-2 py-1 font-mono text-sm" /><Btn onClick={() => setC('<img src=x onerror="kirim(document.cookie)">')}>Contoh payload</Btn><Btn active={escape} onClick={() => setEscape(!escape)}>Escape output: {escape ? "ON" : "OFF"}</Btn></>}
    >
      <p className="mb-1 text-xs font-bold">HTML yang dikirim server ke browser:</p>
      <pre className={`rounded-xl border-2 border-ink p-3 font-mono text-[12px] break-all whitespace-pre-wrap ${danger ? "bg-[#3a1220] text-[#ffb4a2]" : "bg-ink text-paper"}`}>{html}</pre>
      <p className={`mt-3 rounded-lg border-2 border-ink p-3 text-sm font-semibold ${danger ? "bg-[#ffe4dc]" : "bg-[#dff5e7]"}`}>
        {danger ? "Browser akan menafsirkan ini sebagai elemen HTML dengan event handler → kode penyerang berjalan di sesi korban." : "Aman: browser menampilkan teks apa adanya."}
      </p>
    </VizFrame>
  );
}

/* ================= BOUNDARY VALUE ================= */
export function BoundaryViz() {
  const [min, setMin] = useState(17);
  const [max, setMax] = useState(60);
  const [v, setV] = useState(16);
  const ok = v >= min && v <= max;
  const tests = [min - 1, min, min + 1, Math.round((min + max) / 2), max - 1, max, max + 1];
  const X = (x: number) => ((x - 0) / 80) * 100;
  return (
    <VizFrame
      title="Equivalence partitioning & boundary value analysis"
      caption={`Aturan: usia pendaftar ${min}–${max} tahun. Daripada mengetes semua angka, bagi menjadi 3 partisi (terlalu muda, valid, terlalu tua), lalu fokus pada batas, tempat bug ‘off-by-one’ (mis. < tertukar dengan <=) paling sering bersembunyi.`}
      controls={<><Slider label="Batas bawah" value={min} min={5} max={30} onChange={setMin} /><Slider label="Batas atas" value={max} min={40} max={75} onChange={setMax} /><Slider label="Nilai uji" value={v} min={0} max={80} onChange={setV} /></>}
    >
      <div className="relative h-14 rounded-xl border-2 border-ink bg-paper">
        <div className="absolute inset-y-0 left-0 rounded-l-[10px] bg-[#ffe4dc]" style={{ width: `${X(min)}%` }} />
        <div className="absolute inset-y-0 bg-[#dff5e7]" style={{ left: `${X(min)}%`, width: `${X(max + 1) - X(min)}%` }} />
        <div className="absolute inset-y-0 right-0 rounded-r-[10px] bg-[#ffe4dc]" style={{ left: `${X(max + 1)}%` }} />
        {tests.map((t) => <span key={t} className="absolute top-1 h-3 w-0.5 bg-ink" style={{ left: `${X(t)}%` }} />)}
        <motion.span className="absolute top-3 grid size-8 -translate-x-1/2 place-items-center rounded-full border-2 border-ink bg-sun-400 font-mono text-xs font-bold" animate={{ left: `${X(v)}%` }}>{v}</motion.span>
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-bold text-muted"><span>Partisi invalid</span><span>Partisi valid</span><span>Partisi invalid</span></div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold">Test case BVA:</span>
        {tests.map((t) => <button key={t} onClick={() => setV(t)} className={`rounded-md border-2 border-ink px-2 py-0.5 font-mono text-xs font-bold ${t >= min && t <= max ? "bg-[#dff5e7]" : "bg-[#ffe4dc]"}`}>{t}</button>)}
      </div>
      <p className={`mt-3 text-sm font-bold ${ok ? "text-[#1f8a4c]" : "text-[#d9534f]"}`}>Usia {v} → sistem harus {ok ? "MENERIMA" : "MENOLAK"}</p>
    </VizFrame>
  );
}

/* ================= PWM ================= */
export function PwmViz() {
  const [duty, setDuty] = useState(40);
  const [freq, setFreq] = useState(4);
  const period = 400 / freq;
  const d = Array.from({ length: freq }, (_, i) => { const x0 = i * period, xh = x0 + (period * duty) / 100; return `${i ? "" : "M0,70 "}L${x0},70 L${x0},15 L${xh},15 L${xh},70 L${x0 + period},70`; }).join(" ");
  return (
    <VizFrame
      title="PWM: meniru tegangan analog dengan sinyal digital"
      caption="Pin digital hanya bisa 0 V atau 3,3/5 V. Dengan menyalakan-mematikan sangat cepat, tegangan rata-rata = duty cycle × Vcc. Mata kita melihat LED meredup; motor DC berputar lebih pelan. Di Arduino: analogWrite(pin, 0–255)."
      controls={<><Slider label="Duty cycle" value={duty} min={0} max={100} onChange={setDuty} format={(v) => `${v}%`} /><Slider label="Siklus ditampilkan" value={freq} min={1} max={10} onChange={setFreq} /></>}
    >
      <div className="grid items-center gap-4 md:grid-cols-[1.5fr_auto]">
        <svg viewBox="-5 0 410 85" className="w-full rounded-xl border-2 border-ink bg-paper"><path d={d} fill="none" stroke="#12203a" strokeWidth={2.5} /><line x1={0} y1={70 - 55 * (duty / 100)} x2={400} y2={70 - 55 * (duty / 100)} stroke="#d9534f" strokeDasharray="5 4" strokeWidth={1.5} /><text x={398} y={66 - 55 * (duty / 100)} fontSize={9} textAnchor="end" fill="#d9534f">rata-rata</text></svg>
        <div className="flex flex-col items-center gap-2">
          <motion.div className="size-16 rounded-full border-2 border-ink" animate={{ backgroundColor: `rgba(254,197,54,${duty / 100})`, boxShadow: `0 0 ${duty / 2}px rgba(254,197,54,${duty / 100})` }} />
          <span className="font-mono text-xs">LED</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2"><Stat k="Tegangan rata-rata (5 V)" v={`${((5 * duty) / 100).toFixed(2)} V`} /><Stat k="analogWrite (8-bit)" v={Math.round((duty / 100) * 255)} /><Stat k="Kode" v={`analogWrite(9, ${Math.round((duty / 100) * 255)})`} /></div>
    </VizFrame>
  );
}

/* ================= HUKUM OHM ================= */
export function OhmViz() {
  const [v, setV] = useState(5);
  const [r, setR] = useState(220);
  const vf = 2, iMax = 20;
  const i = Math.max(0, ((v - vf) / r) * 1000);
  const burn = i > iMax;
  const rIdeal = Math.ceil(((v - vf) / (iMax / 1000)) / 10) * 10;
  return (
    <VizFrame
      title="Hukum Ohm: menghitung resistor untuk LED"
      caption="V = I × R. LED merah butuh ~2 V (tegangan maju) dan aman di ≤ 20 mA. Sisa tegangan harus ‘ditanggung’ resistor: R = (Vsumber − V_LED) ÷ I. Tanpa resistor yang cukup, arus melonjak dan LED (atau pin mikrokontroler) bisa rusak."
      controls={<><Slider label="Tegangan sumber" value={v} min={2.5} max={12} step={0.5} onChange={setV} format={(x) => `${x} V`} /><Slider label="Resistor" value={r} min={10} max={1000} step={10} onChange={setR} format={(x) => `${x} Ω`} /></>}
    >
      <div className="grid items-center gap-4 md:grid-cols-[1.3fr_1fr]">
        <svg viewBox="0 0 320 150" className="w-full rounded-xl border-2 border-ink bg-paper">
          <rect x={20} y={40} width={30} height={70} rx={4} fill="#fff1c2" stroke="#12203a" strokeWidth={2} /><text x={35} y={80} textAnchor="middle" fontSize={11} fontWeight={800}>{v}V</text>
          <path d="M35,40 V20 H290 V60 M290,100 V130 H35 V110" fill="none" stroke="#12203a" strokeWidth={2.5} />
          <path d="M120,20 l5,-8 l10,16 l10,-16 l10,16 l10,-16 l5,8" fill="none" stroke="#12203a" strokeWidth={2.5} transform="translate(0,0)" /><rect x={118} y={10} width={64} height={20} fill="none" /><text x={150} y={46} textAnchor="middle" fontSize={11} fontWeight={700}>{r} Ω</text>
          <motion.circle cx={290} cy={80} r={20} stroke="#12203a" strokeWidth={2.5} animate={{ fill: burn ? "#555" : `rgba(217,83,79,${Math.min(i / 20, 1)})` }} /><text x={290} y={84} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff">{burn ? "RUSAK" : "LED"}</text>
        </svg>
        <div className="space-y-2">
          <Stat k="Arus I = (V − 2) / R" v={`${i.toFixed(1)} mA`} tone={burn ? "bad" : i < 2 ? "warn" : "good"} />
          <Stat k="Resistor minimal (≤ 20 mA)" v={`≈ ${rIdeal} Ω`} />
          <p className="text-xs text-muted">{burn ? "Arus melebihi batas! Perbesar resistor." : i < 2 ? "Arus sangat kecil: LED redup atau tidak menyala." : "Arus aman."}</p>
        </div>
      </div>
    </VizFrame>
  );
}

/* ================= GAME LOOP & DELTA TIME ================= */
export function GameLoopViz() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState(60);
  const [useDt, setUseDt] = useState(true);
  const [gravity, setGravity] = useState(true);
  const state = useRef({ x: 40, y: 40, vx: 180, vy: 0, last: 0, acc: 0, frames: 0, shown: 0, t0: 0 });
  const [shownFps, setShownFps] = useState(0);
  useEffect(() => {
    let raf = 0;
    const s = state.current;
    s.last = performance.now(); s.t0 = s.last; s.frames = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      s.acc += now - s.last; s.last = now;
      const frameMs = 1000 / fps;
      if (s.acc < frameMs) return;
      const dt = useDt ? s.acc / 1000 : 1 / 60;
      s.acc = 0; s.frames++;
      if (now - s.t0 > 500) { setShownFps(Math.round((s.frames * 1000) / (now - s.t0))); s.t0 = now; s.frames = 0; }
      const c = ref.current; if (!c) return;
      const W2 = c.width, H2 = c.height;
      if (gravity) s.vy += 900 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 14 || s.x > W2 - 14) { s.vx *= -1; s.x = Math.max(14, Math.min(W2 - 14, s.x)); }
      if (s.y > H2 - 14) { s.y = H2 - 14; s.vy = gravity ? -Math.abs(s.vy) * 0.92 : -Math.abs(s.vy); if (Math.abs(s.vy) < 60) s.vy = -520; }
      if (s.y < 14) { s.y = 14; s.vy = Math.abs(s.vy); }
      const g = c.getContext("2d")!;
      g.fillStyle = "rgba(253,249,238,0.35)"; g.fillRect(0, 0, W2, H2);
      g.beginPath(); g.arc(s.x, s.y, 14, 0, Math.PI * 2); g.fillStyle = "#fec536"; g.fill(); g.lineWidth = 3; g.strokeStyle = "#12203a"; g.stroke();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps, useDt, gravity]);
  return (
    <VizFrame
      title="Game loop & delta time"
      caption="Turunkan FPS dengan delta time OFF: bola melambat, karena posisi ditambah jumlah tetap per frame. Dengan delta time ON, perpindahan = kecepatan × waktu yang benar-benar berlalu, sehingga kecepatan sama di komputer lambat maupun cepat (gerakan hanya terlihat patah-patah)."
      controls={<><Slider label="Target FPS" value={fps} min={5} max={60} onChange={setFps} /><Btn active={useDt} onClick={() => setUseDt(!useDt)}>Delta time: {useDt ? "ON" : "OFF"}</Btn><Btn active={gravity} onClick={() => setGravity(!gravity)}>Gravitasi: {gravity ? "ON" : "OFF"}</Btn><span className="font-mono text-xs">FPS aktual: {shownFps}</span></>}
    >
      <canvas ref={ref} width={560} height={220} className="w-full rounded-xl border-2 border-ink bg-cream" />
      <pre className="mt-3 rounded-lg border-2 border-ink bg-ink p-2.5 font-mono text-[11.5px] text-paper">{useDt ? "posisi += kecepatan * delta  # px/detik × detik" : "posisi += kecepatan / 60     # anggap selalu 60 FPS (salah!)"}</pre>
    </VizFrame>
  );
}

/* ================= AABB COLLISION ================= */
export function AabbViz() {
  const [ax, setAx] = useState(60), [ay, setAy] = useState(60);
  const b = { x: 180, y: 70, w: 110, h: 80 };
  const a = { x: ax, y: ay, w: 90, h: 70 };
  const hit = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const conds = [["A.kiri < B.kanan", a.x < b.x + b.w], ["A.kanan > B.kiri", a.x + a.w > b.x], ["A.atas < B.bawah", a.y < b.y + b.h], ["A.bawah > B.atas", a.y + a.h > b.y]] as const;
  return (
    <VizFrame
      title="Collision detection AABB"
      caption="Axis-Aligned Bounding Box: dua kotak bertabrakan jika dan hanya jika keempat syarat terpenuhi bersamaan. Ini murah dihitung sehingga dipakai sebagai pemeriksaan awal sebelum pengecekan bentuk yang lebih presisi. Rumus yang sama dipakai untuk menghitung IoU di computer vision."
      controls={<><Slider label="Kotak A: x" value={ax} min={0} max={320} onChange={setAx} /><Slider label="Kotak A: y" value={ay} min={0} max={150} onChange={setAy} /></>}
    >
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <svg viewBox="0 0 420 230" className="w-full rounded-xl border-2 border-ink bg-paper">
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#cfe3ff" stroke="#12203a" strokeWidth={2.5} /><text x={b.x + 6} y={b.y + 16} fontSize={12} fontWeight={800}>B</text>
          <rect x={a.x} y={a.y} width={a.w} height={a.h} fill={hit ? "#ffb4a2" : "#fec536"} fillOpacity={0.85} stroke="#12203a" strokeWidth={2.5} /><text x={a.x + 6} y={a.y + 16} fontSize={12} fontWeight={800}>A</text>
        </svg>
        <div className="space-y-1.5">
          {conds.map(([l, ok]) => <div key={l} className={`flex justify-between rounded-lg border-2 border-ink px-3 py-1.5 font-mono text-xs font-bold ${ok ? "bg-[#dff5e7]" : "bg-[#ffe4dc]"}`}><span>{l}</span><span>{ok ? "✓" : "✗"}</span></div>)}
          <Stat k="Hasil" v={hit ? "TABRAKAN!" : "Tidak bertabrakan"} tone={hit ? "bad" : "good"} />
        </div>
      </div>
    </VizFrame>
  );
}
