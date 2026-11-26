"use client";

import { useState, type CSSProperties } from "react";
import { CheckCircle2, Database, GitBranch, LayoutGrid, Sparkles } from "lucide-react";
import { recordStudyAction, useGamification } from "@/lib/gamification";

type CssMission = {
  id: number;
  title: string;
  desc: string;
  count: number;
  target: { justifyContent: string; alignItems: string; flexDirection?: "row" | "column" };
};

type ChoiceMission = {
  id: number;
  realm: "sql" | "git";
  title: string;
  scenario: string;
  context?: string;
  options: string[];
  answer: number;
  explain: string;
};

const CSS_MISSIONS: CssMission[] = [
  {
    id: 101,
    title: "CSS #1: Pindahkan ke Tengah",
    desc: "Atur properti Flexbox agar Tahu berada tepat di tengah piring (horizontal & vertikal).",
    count: 1,
    target: { justifyContent: "center", alignItems: "center", flexDirection: "row" },
  },
  {
    id: 102,
    title: "CSS #2: Pojok Kanan Bawah",
    desc: "Pindahkan Tahu ke pojok kanan bawah wadah!",
    count: 1,
    target: { justifyContent: "flex-end", alignItems: "flex-end", flexDirection: "row" },
  },
  {
    id: 103,
    title: "CSS #3: Renggangkan 3 Tahu",
    desc: "Susun 3 Tahu menyebar merata dari tepi kiri ke tepi kanan di bagian atas.",
    count: 3,
    target: { justifyContent: "space-between", alignItems: "flex-start", flexDirection: "row" },
  },
  {
    id: 104,
    title: "CSS #4: Tumpuk Vertikal di Kanan",
    desc: "Ubah arah menjadi kolom (`column`) dan letakkan kedua Tahu di bagian bawah-kanan.",
    count: 2,
    target: { justifyContent: "flex-end", alignItems: "flex-end", flexDirection: "column" },
  },
];

const CHOICE_MISSIONS: ChoiceMission[] = [
  {
    id: 201,
    realm: "sql",
    title: "SQL #1: Saring Produk Termurah",
    scenario: "Dari tabel `produk(id, nama, kategori, harga)`, ambil nama & harga khusus kategori 'Tahu' dengan harga ≤ 15000, urutkan dari paling murah.",
    context: "id | nama          | kategori | harga\n1  | Tahu Krispi   | Tahu     | 12000\n2  | Tahu Gejrot   | Tahu     | 15000\n3  | Es Teh Manis  | Minuman  | 5000\n4  | Tahu Premium  | Tahu     | 25000",
    options: [
      "SELECT nama, harga FROM produk WHERE kategori = 'Tahu' AND harga <= 15000 ORDER BY harga ASC;",
      "SELECT nama, harga FROM produk HAVING kategori = 'Tahu' ORDER BY harga DESC;",
      "GET nama, harga IN produk WHERE harga <= 15000;",
      "SELECT * FROM produk GROUP BY kategori WHERE harga <= 15000;",
    ],
    answer: 0,
    explain: "WHERE menyaring kategori & harga, lalu ORDER BY harga ASC mengurutkan dari terkecil ke terbesar.",
  },
  {
    id: 202,
    realm: "sql",
    title: "SQL #2: Hitung Total per Kota",
    scenario: "Kamu diminta menampilkan jumlah pelanggan unik per kota dari tabel `pesanan(id, pelanggan_id, kota)`.",
    options: [
      "SELECT kota, COUNT(DISTINCT pelanggan_id) AS jml FROM pesanan GROUP BY kota;",
      "SELECT kota, SUM(pelanggan_id) FROM pesanan GROUP BY kota;",
      "SELECT kota, COUNT(*) FROM pesanan;",
      "SELECT DISTINCT kota FROM pesanan ORDER BY pelanggan_id;",
    ],
    answer: 0,
    explain: "`COUNT(DISTINCT pelanggan_id)` menghitung pelanggan unik, bukan jumlah baris transaksi, dan `GROUP BY kota` mengelompokkannya per kota.",
  },
  {
    id: 203,
    realm: "sql",
    title: "SQL #3: Pelanggan Belum Pernah Order",
    scenario: "Cari semua pelanggan di tabel `pelanggan` yang belum pernah ada di tabel `pesanan`.",
    options: [
      "SELECT p.nama FROM pelanggan p LEFT JOIN pesanan o ON o.pelanggan_id = p.id WHERE o.id IS NULL;",
      "SELECT p.nama FROM pelanggan p INNER JOIN pesanan o ON o.pelanggan_id = p.id;",
      "SELECT nama FROM pelanggan WHERE id = NULL;",
      "SELECT * FROM pesanan RIGHT JOIN pelanggan;",
    ],
    answer: 0,
    explain: "Pola anti-join klasik: `LEFT JOIN` mempertahankan semua pelanggan, lalu `WHERE o.id IS NULL` menyisakan yang tidak punya pasangan pesanan.",
  },
  {
    id: 301,
    realm: "git",
    title: "Git #1: Salah Commit Pesan (Belum Push)",
    scenario: "Kamu baru saja commit lokal tapi typo di pesan commit dan lupa menambahkan 1 file. Belum di-push ke GitHub.",
    options: [
      "git add file_lupa.ts && git commit --amend",
      "git push --force origin main",
      "rm -rf .git && git init",
      "git reset --hard HEAD~5",
    ],
    answer: 0,
    explain: "`git commit --amend` memperbaiki commit terakhir secara bersih selama belum di-push ke branch bersama.",
  },
  {
    id: 302,
    realm: "git",
    title: "Git #2: Simpan Kerja Sementara",
    scenario: "Kamu sedang di tengah mengedit fitur, tiba-tiba harus pindah ke branch `main` untuk memperbaiki bug darurat tanpa membuat commit setengah jadi.",
    options: [
      "git stash && git switch main",
      "git delete --all && git checkout main",
      "git merge main --force",
      "git clone ulang repo di folder lain",
    ],
    answer: 0,
    explain: "`git stash` menyimpan perubahan sementara di rak; nanti cukup `git stash pop` saat kembali ke branch fiturmu.",
  },
  {
    id: 303,
    realm: "git",
    title: "Terminal #3: Cek Port 3000 & Log Live",
    scenario: "Server Node.js di Linux gagal menyala ('port 3000 already in use'), lalu setelah nyala kamu ingin memantau file `app.log` secara langsung.",
    options: [
      "ss -tulpn | grep 3000  dan  tail -f app.log",
      "ls -la 3000  dan  rm app.log",
      "ping 3000  dan  cat app.log",
      "mkdir 3000  dan  touch app.log",
    ],
    answer: 0,
    explain: "`ss -tulpn` menunjukkan proses yang memakai port 3000, sedangkan `tail -f` menampilkan baris log baru secara real-time.",
  },
];

const JUSTIFY_OPTS = ["flex-start", "center", "flex-end", "space-between"] as const;
const ALIGN_OPTS = ["flex-start", "center", "flex-end"] as const;
const DIR_OPTS = ["row", "column"] as const;

export function TechQuestGame() {
  const { stats } = useGamification();
  const [realm, setRealm] = useState<"css" | "sql" | "git">("css");

  // CSS Flexbox Arena state
  const [cssIdx, setCssIdx] = useState(0);
  const [justify, setJustify] = useState<string>("flex-start");
  const [align, setAlign] = useState<string>("flex-start");
  const [direction, setDirection] = useState<"row" | "column">("row");

  // SQL & Git state
  const [choicePicked, setChoicePicked] = useState<Record<number, number>>({});

  const cssMission = CSS_MISSIONS[cssIdx];
  const cssMatched =
    justify === cssMission.target.justifyContent &&
    align === cssMission.target.alignItems &&
    direction === (cssMission.target.flexDirection ?? "row");

  const claimCss = () => {
    if (!cssMatched) return;
    const already = stats.questsSolved.includes(cssMission.id);
    recordStudyAction(
      (s) => ({
        gamesPlayed: s.gamesPlayed + 1,
        questsSolved: s.questsSolved.includes(cssMission.id) ? s.questsSolved : [...s.questsSolved, cssMission.id],
      }),
      already ? 5 : 30,
    );
    if (cssIdx < CSS_MISSIONS.length - 1) {
      setCssIdx((i) => i + 1);
      setJustify("flex-start");
      setAlign("flex-start");
      setDirection("row");
    }
  };

  const realmChoices = CHOICE_MISSIONS.filter((m) => m.realm === realm);

  const pickChoice = (m: ChoiceMission, oi: number) => {
    setChoicePicked((prev) => ({ ...prev, [m.id]: oi }));
    if (oi === m.answer) {
      const already = stats.questsSolved.includes(m.id);
      recordStudyAction(
        (s) => ({
          gamesPlayed: s.gamesPlayed + 1,
          questsSolved: s.questsSolved.includes(m.id) ? s.questsSolved : [...s.questsSolved, m.id],
        }),
        already ? 5 : 30,
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Realm tabs */}
      <div className="grid grid-cols-3 gap-2 sm:inline-flex">
        {(
          [
            ["css", "CSS Flexbox", LayoutGrid],
            ["sql", "SQL Detective", Database],
            ["git", "Git & Terminal", GitBranch],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRealm(id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink px-3 py-2.5 text-xs font-extrabold sm:px-4 sm:text-sm ${
              realm === id ? "bg-sun-400 shadow-hard-sm" : "bg-paper hover:bg-sun-50"
            }`}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {realm === "css" ? (
        <div className="card overflow-hidden bg-paper">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-sun-100 p-4 sm:p-5">
            <div>
              <h3 className="text-lg font-extrabold">{cssMission.title}</h3>
              <p className="mt-0.5 text-sm text-ink-2">{cssMission.desc}</p>
            </div>
            <div className="flex gap-1.5">
              {CSS_MISSIONS.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setCssIdx(i);
                    setJustify("flex-start");
                    setAlign("flex-start");
                    setDirection("row");
                  }}
                  className={`grid size-8 place-items-center rounded-lg border-2 border-ink font-mono text-xs font-extrabold ${
                    i === cssIdx ? "bg-ink text-sun-300" : stats.questsSolved.includes(m.id) ? "bg-[#dff5e7]" : "bg-paper"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-2">
            {/* Live Flexbox Stage */}
            <div className="relative h-[250px] overflow-hidden rounded-2xl border-2 border-ink bg-[#192847] p-4 shadow-hard-sm">
              {/* Target plates */}
              <div
                className="pointer-events-none absolute inset-4 flex gap-3"
                style={{
                  justifyContent: cssMission.target.justifyContent,
                  alignItems: cssMission.target.alignItems,
                  flexDirection: cssMission.target.flexDirection ?? "row",
                } as CSSProperties}
              >
                {Array.from({ length: cssMission.count }).map((_, i) => (
                  <div key={i} className="grid size-14 place-items-center rounded-2xl border-2 border-dashed border-sun-400 bg-sun-400/15 text-[11px] font-bold text-sun-300">
                    Target
                  </div>
                ))}
              </div>
              {/* Movable Tahu */}
              <div
                className="relative flex h-full w-full gap-3 transition-all"
                style={{
                  justifyContent: justify,
                  alignItems: align,
                  flexDirection: direction,
                } as CSSProperties}
              >
                {Array.from({ length: cssMission.count }).map((_, i) => (
                  <div
                    key={i}
                    className={`grid size-14 place-items-center rounded-2xl border-2 border-ink text-xl font-extrabold shadow-hard-sm transition-colors ${
                      cssMatched ? "bg-[#4fd27a]" : "bg-sun-400"
                    }`}
                  >
                    🟨
                  </div>
                ))}
              </div>
            </div>

            {/* Kontrol Properti CSS */}
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-ink bg-ink p-3.5 font-mono text-xs leading-relaxed text-paper">
                <p className="text-paper/60">.piring &#123;</p>
                <p className="pl-3">display: <span className="text-sun-300">flex</span>;</p>
                <p className="pl-3">flex-direction: <span className="text-[#7ee787]">{direction}</span>;</p>
                <p className="pl-3">justify-content: <span className="text-[#7ee787]">{justify}</span>;</p>
                <p className="pl-3">align-items: <span className="text-[#7ee787]">{align}</span>;</p>
                <p className="text-paper/60">&#125;</p>
              </div>

              <div>
                <p className="font-mono text-xs font-bold text-muted">flex-direction</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {DIR_OPTS.map((v) => (
                    <button key={v} type="button" onClick={() => setDirection(v)} className={`chip font-mono ${direction === v ? "!bg-sun-400" : ""}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-xs font-bold text-muted">justify-content</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {JUSTIFY_OPTS.map((v) => (
                    <button key={v} type="button" onClick={() => setJustify(v)} className={`chip font-mono ${justify === v ? "!bg-sun-400" : ""}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-xs font-bold text-muted">align-items</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ALIGN_OPTS.map((v) => (
                    <button key={v} type="button" onClick={() => setAlign(v)} className={`chip font-mono ${align === v ? "!bg-sun-400" : ""}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {cssMatched && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink bg-[#dff5e7] p-3 text-xs font-extrabold">
                  <span>Pas tepat di atas target! 🎯</span>
                  <button type="button" onClick={claimCss} className="btn btn-dark !px-4 !py-1.5 !text-xs">
                    <Sparkles className="size-3.5" /> {cssIdx < CSS_MISSIONS.length - 1 ? "Klaim +30 XP & Lanjut →" : "Klaim +30 XP"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SQL Detective & Git Rescue */
        <div className="space-y-4">
          {realmChoices.map((m) => {
            const picked = choicePicked[m.id];
            const solved = stats.questsSolved.includes(m.id);
            const answered = picked !== undefined;
            return (
              <div key={m.id} className="card overflow-hidden bg-paper">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-sun-100 px-4 py-3 sm:px-5">
                  <h3 className="text-base font-extrabold sm:text-lg">{m.title}</h3>
                  {solved ? (
                    <span className="chip !bg-[#dff5e7]"><CheckCircle2 className="size-3.5 text-[#1d7a46]" /> Selesai</span>
                  ) : (
                    <span className="chip !bg-paper">+30 XP</span>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-sm leading-relaxed text-ink-2">{m.scenario}</p>
                  {m.context && (
                    <pre className="mt-3 overflow-x-auto rounded-xl border-2 border-ink bg-cream p-3 font-mono text-xs leading-relaxed text-ink">
                      <code>{m.context}</code>
                    </pre>
                  )}
                  <div className="mt-4 grid gap-2">
                    {m.options.map((opt, oi) => {
                      const ok = oi === m.answer;
                      const chosen = picked === oi;
                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => pickChoice(m, oi)}
                          className={`rounded-xl border-2 px-3.5 py-2.5 text-left font-mono text-xs leading-relaxed transition-colors sm:text-[13px] ${
                            answered && ok
                              ? "border-ink bg-[#dff5e7] font-bold"
                              : answered && chosen
                                ? "border-ink bg-[#ffe4dc]"
                                : "border-line bg-ink text-paper hover:border-sun-400"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <p className={`mt-3 rounded-xl p-3 text-xs leading-relaxed ${picked === m.answer ? "bg-[#dff5e7]" : "bg-sun-100"}`}>
                      <strong className="text-ink">{picked === m.answer ? "Tepat! " : "Belum tepat. "}</strong>
                      {m.explain}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
