"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, CheckCircle2, HelpCircle, RotateCcw, Sparkles } from "lucide-react";
import { recordStudyAction, useGamification } from "@/lib/gamification";

type PuzzleLevel = {
  id: number;
  title: string;
  lang: string;
  goal: string;
  lines: string[]; // urutan benar
  hint: string;
  explain: string;
};

const PUZZLES: PuzzleLevel[] = [
  {
    id: 1,
    title: "Cek Kelulusan (Python)",
    lang: "Python",
    goal: "Susun fungsi yang mengembalikan 'Lulus' bila nilai ≥ 75 dan 'Mengulang' jika kurang.",
    lines: [
      "def cek_lulus(nilai):",
      "    if nilai >= 75:",
      "        return 'Lulus'",
      "    return 'Mengulang'",
    ],
    hint: "Mulai dari definisi fungsi `def`, lalu kondisi `if`, baru kedua `return`.",
    explain: "Jika kondisi `nilai >= 75` benar, fungsi langsung berhenti di `return 'Lulus'`. Jika tidak, lanjut ke `return 'Mengulang'`.",
  },
  {
    id: 2,
    title: "Ambil Data API (JavaScript)",
    lang: "JavaScript",
    goal: "Susun fungsi async fetch yang memeriksa res.ok sebelum mem-parsing JSON.",
    lines: [
      "async function ambilProduk() {",
      "  const res = await fetch('/api/produk');",
      "  if (!res.ok) throw new Error('Gagal');",
      "  return await res.json();",
      "}",
    ],
    hint: "Fetch dulu, baru cek `if (!res.ok)`, lalu parse `res.json()`, tutup kurung kurawal.",
    explain: "`fetch()` tidak otomatis menolak HTTP 404/500, jadi wajib memeriksa `res.ok` sebelum membaca body JSON.",
  },
  {
    id: 3,
    title: "Query Omzet Per Kota (SQL)",
    lang: "SQL",
    goal: "Susun query SQL untuk mengambil total omzet per kota di atas 1 juta, diurutkan dari terbesar.",
    lines: [
      "SELECT kota, SUM(total) AS omzet",
      "FROM transaksi",
      "WHERE status = 'selesai'",
      "GROUP BY kota",
      "HAVING SUM(total) > 1000000",
      "ORDER BY omzet DESC;",
    ],
    hint: "Ingat urutan tulis SQL: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY.",
    explain: "WHERE menyaring baris sebelum dikelompokkan, sedangkan HAVING menyaring kelompok setelah agregasi SUM.",
  },
  {
    id: 4,
    title: "Training Step PyTorch",
    lang: "Python / PyTorch",
    goal: "Susun 5 baris inti satu langkah training neural network di PyTorch.",
    lines: [
      "optimizer.zero_grad()",
      "pred = model(x_batch)",
      "loss = loss_fn(pred, y_batch)",
      "loss.backward()",
      "optimizer.step()",
    ],
    hint: "Nolkan gradien dulu, forward, hitung loss, backward, baru update bobot!",
    explain: "PyTorch mengakumulasi gradien secara default, jadi `zero_grad()` wajib sebelum `backward()` dan `step()`.",
  },
  {
    id: 5,
    title: "Alur Branch Git Rapi",
    lang: "Git / Terminal",
    goal: "Susun urutan perintah membuat branch fitur baru, menyimpan perubahan, dan mengirimnya ke GitHub.",
    lines: [
      "git switch -c feat/login",
      "git add src/login.ts",
      "git commit -m 'feat: halaman login'",
      "git push -u origin feat/login",
    ],
    hint: "Buat branch dulu → stage file → commit → push ke remote.",
    explain: "Mengerjakan fitur di branch terpisah menjaga branch `main` selalu bersih dan siap di-review via Pull Request.",
  },
  {
    id: 6,
    title: "Struktur HTML Semantik",
    lang: "HTML",
    goal: "Susun kerangka halaman web semantik yang ramah aksesibilitas.",
    lines: [
      "<header><nav><a href='/'>Beranda</a></nav></header>",
      "<main>",
      "  <h1>Artikel Teknologi</h1>",
      "  <p>Belajar terstruktur di SatuTahu.</p>",
      "</main>",
      "<footer>© 2026 SatuTahu</footer>",
    ],
    hint: "Header di atas, konten utama di dalam `<main>...</main>`, lalu `<footer>` di bawah.",
    explain: "Landmark `<header>`, `<nav>`, `<main>`, dan `<footer>` memudahkan pembaca layar melompat ke bagian yang diinginkan.",
  },
  {
    id: 7,
    title: "Cegah IDOR di Backend",
    lang: "TypeScript",
    goal: "Susun handler endpoint yang memastikan hanya pemilik pesanan yang boleh melihat detailnya.",
    lines: [
      "const order = await db.findOrder(orderId);",
      "if (!order) return res.status(404).end();",
      "if (order.userId !== currentUser.id) {",
      "  return res.status(403).json({ error: 'Dilarang' });",
      "}",
      "return res.json(order);",
    ],
    hint: "Cari data dulu → cek ada/tidak (404) → cek kepemilikan (403) → baru kirim data.",
    explain: "Selalu verifikasi kepemilikan resource di server pada setiap request untuk mencegah Broken Access Control (OWASP A01).",
  },
  {
    id: 8,
    title: "Filter & Total Keranjang (JS)",
    lang: "JavaScript",
    goal: "Susun rantai method array untuk menghitung total harga barang yang stoknya tersedia.",
    lines: [
      "const total = keranjang",
      "  .filter((item) => item.tersedia)",
      "  .map((item) => item.harga * item.qty)",
      "  .reduce((acc, sub) => acc + sub, 0);",
    ],
    hint: "Mulai deklarasi `const total`, lalu saring (`.filter`), hitung subtotal (`.map`), jumlahkan (`.reduce`).",
    explain: "Pola deklaratif `filter → map → reduce` tidak memutasi array asli dan sangat mudah dibaca.",
  },
];

function deterministicShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed * 9301 + 49297;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  // Pastikan tidak kebetulan sudah terurut persis sama
  if (copy.every((v, i) => v === arr[i]) && copy.length > 1) {
    [copy[0], copy[1]] = [copy[1], copy[0]];
  }
  return copy;
}

export function CodePuzzleGame() {
  const { stats } = useGamification();
  const [idx, setIdx] = useState(0);
  const puzzle = PUZZLES[idx];

  const initialOrder = useMemo(() => deterministicShuffle(puzzle.lines, puzzle.id + 7), [puzzle]);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const selectLevel = (nextIdx: number) => {
    setIdx(nextIdx);
    const next = PUZZLES[nextIdx];
    setOrder(deterministicShuffle(next.lines, next.id + 7));
    setChecked(false);
    setShowHint(false);
  };

  const move = (i: number, delta: -1 | 1) => {
    const j = i + delta;
    if (j < 0 || j >= order.length) return;
    const copy = [...order];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setOrder(copy);
    setChecked(false);
  };

  const isCorrect = order.every((line, i) => line === puzzle.lines[i]);

  const checkAnswer = () => {
    setChecked(true);
    if (isCorrect) {
      const already = stats.puzzlesSolved.includes(puzzle.id);
      recordStudyAction(
        (s) => ({
          gamesPlayed: s.gamesPlayed + 1,
          puzzlesSolved: s.puzzlesSolved.includes(puzzle.id) ? s.puzzlesSolved : [...s.puzzlesSolved, puzzle.id],
        }),
        already ? 10 : 30,
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {PUZZLES.map((p, i) => {
          const solved = stats.puzzlesSolved.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectLevel(i)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-2 text-xs font-extrabold ${
                i === idx ? "bg-sun-400 shadow-hard-sm" : "bg-paper hover:bg-sun-50"
              }`}
            >
              <span>#{p.id} {p.lang}</span>
              {solved && <CheckCircle2 className="size-3.5 text-[#1d7a46]" />}
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden bg-paper">
        <div className="border-b-2 border-ink bg-sun-100 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="chip !bg-paper">{puzzle.lang}</span>
            <span className="chip !bg-[#dff5e7]"><Sparkles className="size-3" /> +30 XP</span>
          </div>
          <h3 className="mt-2 text-lg font-extrabold sm:text-xl">{puzzle.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{puzzle.goal}</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="mb-3 text-xs font-bold text-muted">Gunakan tombol panah ↑ / ↓ untuk menyusun baris kode ke urutan yang tepat:</p>
          <ol className="space-y-2">
            {order.map((line, i) => {
              const rightHere = checked && line === puzzle.lines[i];
              const wrongHere = checked && line !== puzzle.lines[i];
              return (
                <li
                  key={`${puzzle.id}-${line}`}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-colors ${
                    rightHere ? "border-ink bg-[#dff5e7]" : wrongHere ? "border-ink bg-[#ffe4dc]" : "border-ink bg-ink text-paper"
                  }`}
                >
                  <span className={`font-mono text-xs font-bold opacity-60 ${checked ? "text-ink" : "text-sun-300"}`}>{i + 1}.</span>
                  <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-relaxed sm:text-[13px]">
                    <code>{line}</code>
                  </pre>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      aria-label="Geser ke atas"
                      className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-paper text-ink hover:bg-sun-200 disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={i === order.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label="Geser ke bawah"
                      className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-paper text-ink hover:bg-sun-200 disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>

          {showHint && (
            <div className="mt-4 rounded-xl border-2 border-dashed border-ink/40 bg-sun-50 p-3 text-xs leading-relaxed text-ink-2">
              <strong className="text-ink">Petunjuk: </strong>
              {puzzle.hint}
            </div>
          )}

          {checked && (
            <div className={`mt-4 rounded-xl border-2 border-ink p-4 text-sm ${isCorrect ? "bg-[#dff5e7]" : "bg-[#ffe4dc]"}`}>
              <p className="font-extrabold">{isCorrect ? "Tepat sekali! Urutan kodemu 100% benar 🎉" : "Masih ada baris yang belum di posisi tepat (ditandai merah)."}</p>
              {isCorrect && <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{puzzle.explain}</p>}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowHint((h) => !h)} className="btn btn-ghost !px-3 !py-2 !text-xs">
                <HelpCircle className="size-3.5" /> Petunjuk
              </button>
              <button type="button" onClick={() => selectLevel(idx)} className="btn btn-ghost !px-3 !py-2 !text-xs">
                <RotateCcw className="size-3.5" /> Acak Ulang
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={checkAnswer} className="btn btn-primary !px-5 !py-2 !text-xs">
                <Check className="size-4" /> Cek Susunan
              </button>
              {checked && isCorrect && idx < PUZZLES.length - 1 && (
                <button type="button" onClick={() => selectLevel(idx + 1)} className="btn btn-dark !px-4 !py-2 !text-xs">
                  Level Berikutnya →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
