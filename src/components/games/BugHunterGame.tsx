"use client";

import { useEffect, useState } from "react";
import { Flame, Heart, Play, RotateCcw, Sparkles, Timer, Trophy } from "lucide-react";
import { recordStudyAction, useGamification } from "@/lib/gamification";

type BugQuestion = {
  id: number;
  category: "JS" | "Python" | "SQL" | "Web/CSS" | "Security & AI";
  kind: "Tebak Output" | "Temukan Bug";
  prompt: string;
  code: string;
  options: string[];
  answer: number;
  explain: string;
};

const QUESTIONS: BugQuestion[] = [
  {
    id: 1,
    category: "JS",
    kind: "Tebak Output",
    prompt: "Apa yang tercetak di console?",
    code: `console.log(typeof null);\nconsole.log("5" + 2);\nconsole.log("5" - 2);`,
    options: ["object, 52, 3", "null, 7, 3", "object, 7, 3", "undefined, 52, NaN"],
    answer: 0,
    explain: "`typeof null` adalah bug historis JS ('object'). `+` dengan string menyambung teks ('52'), sedangkan `-` memaksa konversi angka (3).",
  },
  {
    id: 2,
    category: "Python",
    kind: "Tebak Output",
    prompt: "Apa hasil eksekusi kode Python berikut?",
    code: `angka = [10, 20, 30, 40]\nprint(angka[-1], angka[1:3])`,
    options: ["40 [20, 30]", "10 [10, 20, 30]", "40 [20, 30, 40]", "IndexError"],
    answer: 0,
    explain: "Indeks `-1` mengambil elemen terakhir (40). Slicing `1:3` mengambil indeks 1 dan 2 (indeks akhir tidak ikut).",
  },
  {
    id: 3,
    category: "JS",
    kind: "Temukan Bug",
    prompt: "Kenapa state `items` di React di bawah tidak memicu re-render UI?",
    code: `const [items, setItems] = useState(["Tahu"]);\nfunction tambah() {\n  items.push("Tempe");\n  setItems(items);\n}`,
    options: [
      "Array dimutasi langsung sehingga referensinya tetap sama; harus setItems([...items, 'Tempe'])",
      "useState tidak boleh menyimpan array",
      "push() hanya ada di Python",
      "Nama fungsi harus onClick",
    ],
    answer: 0,
    explain: "React membandingkan state secara dangkal (Object.is). Mutasi langsung membuat referensi array sama sehingga React mengira tidak ada perubahan.",
  },
  {
    id: 4,
    category: "SQL",
    kind: "Temukan Bug",
    prompt: "Query ini gagal menemukan pelanggan yang emailnya kosong. Apa penyebabnya?",
    code: `SELECT nama FROM pelanggan\nWHERE email = NULL;`,
    options: [
      "Harus memakai `WHERE email IS NULL`, bukan `= NULL`",
      "Harus memakai `== NULL`",
      "SELECT tidak boleh mengambil 1 kolom",
      "NULL harus ditulis huruf kecil",
    ],
    answer: 0,
    explain: "Dalam logika 3-nilai SQL, perbandingan `= NULL` selalu bernilai UNKNOWN (bukan TRUE). Gunakan `IS NULL`.",
  },
  {
    id: 5,
    category: "Python",
    kind: "Temukan Bug",
    prompt: "Kenapa pemanggilan `tambah_item('B')` kedua ikut berisi `'A'`?",
    code: `def tambah_item(x, daftar=[]):\n    daftar.append(x)\n    return daftar\n\nprint(tambah_item('A'))\nprint(tambah_item('B'))`,
    options: [
      "Default argument list `[]` dibuat sekali saat fungsi didefinisikan (mutable default); gunakan `daftar=None`",
      "append() menghapus isi sebelumnya",
      "Python tidak mendukung parameter default",
      "print() menyimpan cache",
    ],
    answer: 0,
    explain: "Jebakan klasik Python! Selalu gunakan `daftar=None` lalu `if daftar is None: daftar = []` di dalam fungsi.",
  },
  {
    id: 6,
    category: "Web/CSS",
    kind: "Temukan Bug",
    prompt: "Elemen `.box` diberi `width: 100%; padding: 20px;` tapi malah muncul scrollbar horizontal di HP. Obatnya?",
    code: `.box {\n  width: 100%;\n  padding: 20px;\n  border: 2px solid #12203a;\n}`,
    options: [
      "Tambahkan `box-sizing: border-box;` agar padding & border masuk ke hitungan 100%",
      "Ubah `width: 120%`",
      "Hapus `border` saja",
      "Ganti `padding` menjadi `margin`",
    ],
    answer: 0,
    explain: "Default CSS adalah `content-box`, sehingga width 100% + padding 40px + border 4px melebihi lebar layar!",
  },
  {
    id: 7,
    category: "JS",
    kind: "Tebak Output",
    prompt: "Urutan output Event Loop yang tercetak di console?",
    code: `console.log("1");\nsetTimeout(() => console.log("2"), 0);\nPromise.resolve().then(() => console.log("3"));\nconsole.log("4");`,
    options: ["1, 4, 3, 2", "1, 2, 3, 4", "1, 3, 4, 2", "4, 3, 2, 1"],
    answer: 0,
    explain: "Kode sinkron jalan dulu (1, 4), lalu antrean microtask Promise (3), baru macrotask setTimeout (2).",
  },
  {
    id: 8,
    category: "Security & AI",
    kind: "Temukan Bug",
    prompt: "Di mana celah keamanan paling berbahaya pada endpoint Express ini?",
    code: `app.get('/user', async (req, res) => {\n  const q = "SELECT * FROM users WHERE name = '" + req.query.name + "'";\n  const rows = await db.query(q);\n  res.json(rows);\n});`,
    options: [
      "SQL Injection karena input digabung ke string query; harus pakai parameterized query ($1)",
      "Seharusnya pakai method POST",
      "Kurang titik koma di SQL",
      "res.json() tidak aman",
    ],
    answer: 0,
    explain: "Penggabungan string langsung memungkinkan penyerang menyuntikkan `' OR '1'='1` untuk membaca seluruh tabel users.",
  },
  {
    id: 9,
    category: "SQL",
    kind: "Temukan Bug",
    prompt: "Query untuk menampilkan kota dengan total omzet > 5 juta ini error. Kenapa?",
    code: `SELECT kota, SUM(harga) AS total\nFROM pesanan\nWHERE SUM(harga) > 5000000\nGROUP BY kota;`,
    options: [
      "Fungsi agregasi `SUM()` tidak boleh di `WHERE`; pindahkan ke `HAVING` setelah `GROUP BY`",
      "`AS total` tidak diperbolehkan",
      "`GROUP BY` harus di atas `FROM`",
      "`SUM` hanya bisa untuk kolom angka bulat",
    ],
    answer: 0,
    explain: "`WHERE` dieksekusi sebelum `GROUP BY`. Penyaringan hasil agregasi wajib menggunakan `HAVING`.",
  },
  {
    id: 10,
    category: "Security & AI",
    kind: "Temukan Bug",
    prompt: "Pelatihan klasifikasi 10 kelas di PyTorch sangat lambat & akurasi aneh. Apa bug pada model ini?",
    code: `self.net = nn.Sequential(\n  nn.Linear(784, 128), nn.ReLU(),\n  nn.Linear(128, 10), nn.Softmax(dim=1)\n)\nloss_fn = nn.CrossEntropyLoss()`,
    options: [
      "Memakai `nn.Softmax` sebelum `nn.CrossEntropyLoss` (dobel softmax); hapus `nn.Softmax`",
      "`nn.ReLU()` tidak cocok untuk gambar",
      "128 harus diganti 100",
      "CrossEntropyLoss hanya untuk 2 kelas",
    ],
    answer: 0,
    explain: "`nn.CrossEntropyLoss()` di PyTorch sudah menggabungkan `LogSoftmax` + `NLLLoss` dan mengharapkan raw logits.",
  },
  {
    id: 11,
    category: "Web/CSS",
    kind: "Tebak Output",
    prompt: "Berapa skor HTTP status yang paling tepat saat user sudah login tetapi tidak punya izin admin?",
    code: `// User login dengan role: "member"\n// Mengakses: DELETE /api/admin/users/5`,
    options: ["403 Forbidden", "401 Unauthorized", "404 Not Found", "200 OK"],
    answer: 0,
    explain: "401 untuk belum terautentikasi (belum login / token invalid); 403 untuk sudah terautentikasi tapi tidak punya hak akses.",
  },
  {
    id: 12,
    category: "Python",
    kind: "Tebak Output",
    prompt: "Apa output dari potongan kode Python ini?",
    code: `x = 7\nprint(x // 2, x % 2)`,
    options: ["3 1", "3.5 1", "3 0", "4 1"],
    answer: 0,
    explain: "`//` adalah floor division (hasil bulat 3), dan `%` adalah sisa bagi/modulo (1).",
  },
];

const TIME_PER_Q = 25;

export function BugHunterGame() {
  const { stats } = useGamification();
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [deck, setDeck] = useState<BugQuestion[]>(QUESTIONS);
  const [qIdx, setQIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const cur = deck[qIdx];

  const startGame = () => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8);
    setDeck(shuffled);
    setQIdx(0);
    setLives(3);
    setScore(0);
    setCombo(0);
    setPicked(null);
    setTimedOut(false);
    setTimeLeft(TIME_PER_Q);
    setPhase("playing");
  };

  useEffect(() => {
    if (phase !== "playing" || picked !== null || timedOut) return;
    if (timeLeft <= 0) {
      setTimedOut(true);
      setCombo(0);
      setLives((l) => l - 1);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, timeLeft, picked, timedOut]);

  const answer = (oi: number) => {
    if (picked !== null || timedOut) return;
    setPicked(oi);
    if (oi === cur.answer) {
      const nextCombo = combo + 1;
      const mult = Math.min(3, 1 + Math.floor((nextCombo - 1) / 2));
      const gained = (100 + timeLeft * 4) * mult;
      setCombo(nextCombo);
      setScore((s) => s + gained);
    } else {
      setCombo(0);
      setLives((l) => l - 1);
    }
  };

  const nextStep = () => {
    if (lives <= 0 || qIdx + 1 >= deck.length) {
      setPhase("over");
      const xpEarned = Math.max(15, Math.round(score / 25));
      recordStudyAction(
        (s) => ({
          gamesPlayed: s.gamesPlayed + 1,
          bugHunterBest: Math.max(s.bugHunterBest, score),
        }),
        xpEarned,
      );
      return;
    }
    setQIdx((i) => i + 1);
    setPicked(null);
    setTimedOut(false);
    setTimeLeft(TIME_PER_Q);
  };

  if (phase === "ready") {
    return (
      <div className="card bg-paper p-6 text-center sm:p-10">
        <span className="eyebrow">Mode Arcade · 8 Soal Acak</span>
        <h3 className="mt-4 text-2xl font-extrabold sm:text-3xl">Bug Hunter &amp; Tebak Output</h3>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Uji insting debugging-mu! Tebak output kode dan tangkap bug klasik JS, Python, SQL, CSS, Security &amp; PyTorch dalam 25 detik per soal. Jawab beruntun untuk combo ×2 dan ×3!
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs font-bold">
          <span className="chip !bg-sun-100"><Trophy className="size-3.5" /> Rekor terbaik: {stats.bugHunterBest}</span>
          <span className="chip !bg-[#ffe4dc]"><Heart className="size-3.5 fill-[#d9534f] text-[#d9534f]" /> 3 Nyawa</span>
          <span className="chip !bg-[#dff5e7]"><Sparkles className="size-3.5" /> Dapat XP sesuai skor</span>
        </div>
        <button type="button" onClick={startGame} className="btn btn-primary mt-7 !px-7 !py-3 !text-base">
          <Play className="size-5 fill-current" /> Mulai Berburu Bug
        </button>
      </div>
    );
  }

  if (phase === "over") {
    const xpEarned = Math.max(15, Math.round(score / 25));
    return (
      <div className="card bg-sun-100 p-6 text-center sm:p-10">
        <p className="text-4xl">{lives > 0 ? "🏆" : "💥"}</p>
        <h3 className="mt-3 text-2xl font-extrabold sm:text-3xl">{lives > 0 ? "Ronde Selesai!" : "Nyawa Habis!"}</h3>
        <p className="mt-2 font-mono text-4xl font-extrabold">{score} pts</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="chip !bg-paper"><Trophy className="size-3.5" /> Rekor: {Math.max(stats.bugHunterBest, score)}</span>
          <span className="chip !bg-[#dff5e7]"><Sparkles className="size-3.5" /> +{xpEarned} XP didapat</span>
        </div>
        <button type="button" onClick={startGame} className="btn btn-dark mt-6 !px-6 !py-3">
          <RotateCcw className="size-4" /> Main Lagi
        </button>
      </div>
    );
  }

  const revealed = picked !== null || timedOut;

  return (
    <div className="card overflow-hidden bg-paper">
      {/* HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-ink px-4 py-3 text-paper">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-sun-300">SOAL {qIdx + 1}/{deck.length}</span>
          <span className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} className={`size-4 ${i < lives ? "fill-[#ff6b5b] text-[#ff6b5b]" : "text-paper/25"}`} />
            ))}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs font-bold">
          {combo >= 2 && (
            <span className="flex items-center gap-1 rounded-md bg-sun-400 px-2 py-0.5 text-ink">
              <Flame className="size-3.5" /> {combo}x
            </span>
          )}
          <span className={`flex items-center gap-1 ${timeLeft <= 7 ? "text-[#ff6b5b]" : "text-paper"}`}>
            <Timer className="size-3.5" /> {timeLeft}s
          </span>
          <span className="rounded-md bg-paper/15 px-2.5 py-0.5 text-sun-300">{score} pts</span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <span className="chip !bg-sun-200">{cur.category}</span>
          <span className="chip">{cur.kind}</span>
        </div>
        <h3 className="mt-3 text-base font-extrabold sm:text-lg">{cur.prompt}</h3>

        <pre className="mt-3 overflow-x-auto rounded-xl border-2 border-ink bg-ink p-4 font-mono text-xs leading-relaxed text-paper sm:text-[13.5px]">
          <code>{cur.code}</code>
        </pre>

        <div className="mt-4 grid gap-2.5">
          {cur.options.map((opt, oi) => {
            const isCorrect = oi === cur.answer;
            const isPicked = picked === oi;
            return (
              <button
                key={oi}
                type="button"
                disabled={revealed}
                onClick={() => answer(oi)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  revealed && isCorrect
                    ? "border-ink bg-[#dff5e7]"
                    : revealed && isPicked
                      ? "border-ink bg-[#ffe4dc]"
                      : revealed
                        ? "border-line bg-paper text-muted"
                        : "border-ink/30 bg-cream/60 hover:border-ink hover:bg-sun-100"
                }`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-ink bg-paper font-mono text-xs font-extrabold">
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{opt}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className={`mt-4 rounded-xl border-2 border-ink p-4 text-sm ${picked === cur.answer ? "bg-[#dff5e7]" : "bg-sun-100"}`}>
            <p className="font-extrabold">
              {timedOut ? "Waktu habis!" : picked === cur.answer ? "Tepat sekali! 🔥" : "Kurang tepat — catat pelajarannya:"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">{cur.explain}</p>
            <button type="button" onClick={nextStep} className="btn btn-dark mt-3 !px-5 !py-2 !text-xs">
              {lives <= 0 || qIdx + 1 >= deck.length ? "Lihat Hasil Akhir" : "Soal Berikutnya →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
