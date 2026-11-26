"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, CheckCircle2, Play, RotateCcw, RotateCw, Sparkles, Trash2 } from "lucide-react";
import { recordStudyAction, useGamification } from "@/lib/gamification";

type Dir = 0 | 1 | 2 | 3; // 0: atas, 1: kanan, 2: bawah, 3: kiri
type Cmd = "FWD" | "LEFT" | "RIGHT" | "FWD2" | "FWD3";

type BotLevel = {
  id: number;
  name: string;
  size: number;
  start: [number, number];
  dir: Dir;
  goal: [number, number];
  walls: [number, number][];
  stars: [number, number][];
  par: number;
  tip: string;
};

const LEVELS: BotLevel[] = [
  {
    id: 1,
    name: "Langkah Pertama",
    size: 5,
    start: [2, 4],
    dir: 0,
    goal: [2, 1],
    walls: [[1, 2], [3, 2]],
    stars: [[2, 3]],
    par: 2,
    tip: "Tahu Bot menghadap ke atas. Pakai 'Maju ×3' atau 3× 'Maju' untuk mencapai bendera!",
  },
  {
    id: 2,
    name: "Belok di Tikungan",
    size: 5,
    start: [0, 4],
    dir: 1,
    goal: [3, 1],
    walls: [[2, 3], [2, 2], [1, 1]],
    stars: [[3, 4], [3, 2]],
    par: 3,
    tip: "Maju 3 langkah ke kanan, belok kiri, lalu maju 3 langkah ke atas!",
  },
  {
    id: 3,
    name: "Zig-Zag Gudang",
    size: 5,
    start: [0, 4],
    dir: 0,
    goal: [4, 2],
    walls: [[1, 4], [1, 3], [3, 2], [3, 1], [3, 3]],
    stars: [[0, 2], [2, 2]],
    par: 7,
    tip: "Hindari dinding gelap dengan memutar lewat baris atas atau bawah, lalu kumpulkan semua bintang.",
  },
  {
    id: 4,
    name: "Lorong Berputar",
    size: 5,
    start: [0, 0],
    dir: 1,
    goal: [0, 4],
    walls: [[0, 1], [1, 1], [2, 1], [3, 1], [1, 3], [2, 3], [3, 3], [4, 3]],
    stars: [[4, 0], [4, 2], [0, 2]],
    par: 9,
    tip: "Ikuti lorong berbentuk huruf S! Pakai blok 'Maju ×2' dan 'Maju ×3' agar program ringkas.",
  },
  {
    id: 5,
    name: "Kumpulkan Semua Bintang",
    size: 5,
    start: [2, 2],
    dir: 0,
    goal: [4, 4],
    walls: [[1, 1], [3, 1], [1, 3], [3, 3]],
    stars: [[2, 0], [4, 2]],
    par: 7,
    tip: "Ambil bintang di atas dulu, belok ke kanan, lalu turun ke pojok kanan bawah.",
  },
  {
    id: 6,
    name: "Labirin Master Tahu",
    size: 6,
    start: [0, 5],
    dir: 0,
    goal: [5, 0],
    walls: [[1, 5], [1, 4], [1, 3], [3, 0], [3, 1], [3, 2], [3, 3], [4, 3], [2, 1]],
    stars: [[0, 2], [2, 4], [5, 2]],
    par: 10,
    tip: "Rencanakan rute dengan cermat sebelum klik Jalankan — sama seperti menulis algoritma sebelum ngoding!",
  },
];

const CMD_META: Record<Cmd, { label: string; code: string; short: string }> = {
  FWD: { label: "Maju 1", code: "maju(1)", short: "↑1" },
  FWD2: { label: "Maju ×2", code: "ulang(2): maju()", short: "↑2" },
  FWD3: { label: "Maju ×3", code: "ulang(3): maju()", short: "↑3" },
  LEFT: { label: "Belok Kiri", code: "belok_kiri()", short: "↺" },
  RIGHT: { label: "Belok Kanan", code: "belok_kanan()", short: "↻" },
};

const DELTA: Record<Dir, [number, number]> = {
  0: [0, -1],
  1: [1, 0],
  2: [0, 1],
  3: [-1, 0],
};

const ROT_DEG: Record<Dir, number> = { 0: 0, 1: 90, 2: 180, 3: 270 };

export function TahuBotGame() {
  const { stats } = useGamification();
  const [lvlIdx, setLvlIdx] = useState(0);
  const level = LEVELS[lvlIdx];

  const [program, setProgram] = useState<Cmd[]>([]);
  const [pos, setPos] = useState<[number, number]>(level.start);
  const [dir, setDir] = useState<Dir>(level.dir);
  const [collected, setCollected] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "win" | "fail"; msg: string }>({ kind: "idle", msg: level.tip });
  const timerRef = useRef<number | null>(null);

  const resetBoard = (lv = level) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setRunning(false);
    setActiveStep(null);
    setPos(lv.start);
    setDir(lv.dir);
    setCollected([]);
    setStatus({ kind: "idle", msg: lv.tip });
  };

  useEffect(() => {
    setProgram([]);
    resetBoard(LEVELS[lvlIdx]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lvlIdx]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const isWall = (x: number, y: number) => level.walls.some(([wx, wy]) => wx === x && wy === y);
  const isStar = (x: number, y: number) => level.stars.some(([sx, sy]) => sx === x && sy === y);

  const runProgram = () => {
    if (running || program.length === 0) return;
    resetBoard();
    setRunning(true);

    // Ekspansi blok menjadi langkah-langkah atomik beserta indeks blok asalnya
    const actions: { op: "F" | "L" | "R"; blockIdx: number }[] = [];
    program.forEach((cmd, idx) => {
      if (cmd === "FWD") actions.push({ op: "F", blockIdx: idx });
      else if (cmd === "FWD2") actions.push({ op: "F", blockIdx: idx }, { op: "F", blockIdx: idx });
      else if (cmd === "FWD3") actions.push({ op: "F", blockIdx: idx }, { op: "F", blockIdx: idx }, { op: "F", blockIdx: idx });
      else if (cmd === "LEFT") actions.push({ op: "L", blockIdx: idx });
      else if (cmd === "RIGHT") actions.push({ op: "R", blockIdx: idx });
    });

    let cx = level.start[0];
    let cy = level.start[1];
    let cd: Dir = level.dir;
    const got = new Set<string>();
    let step = 0;

    const tick = () => {
      if (step >= actions.length) {
        setRunning(false);
        setActiveStep(null);
        const atGoal = cx === level.goal[0] && cy === level.goal[1];
        const allStars = level.stars.every(([sx, sy]) => got.has(`${sx},${sy}`));
        if (atGoal && allStars) {
          const already = stats.botLevelsCleared.includes(level.id);
          const bonus = program.length <= level.par ? " (Solusi Optimal!)" : "";
          setStatus({ kind: "win", msg: `Berhasil! Tahu Bot sampai tujuan${bonus} ${already ? "" : "+35 XP"}` });
          recordStudyAction(
            (s) => ({
              gamesPlayed: s.gamesPlayed + 1,
              botLevelsCleared: s.botLevelsCleared.includes(level.id) ? s.botLevelsCleared : [...s.botLevelsCleared, level.id],
            }),
            already ? 10 : 35,
          );
        } else if (atGoal && !allStars) {
          setStatus({ kind: "fail", msg: "Sampai bendera, tapi masih ada bintang yang terlewat!" });
        } else {
          setStatus({ kind: "fail", msg: "Program selesai sebelum mencapai bendera. Tambahkan atau ubah perintah!" });
        }
        return;
      }

      const act = actions[step];
      setActiveStep(act.blockIdx);

      if (act.op === "L") {
        cd = ((cd + 3) % 4) as Dir;
        setDir(cd);
      } else if (act.op === "R") {
        cd = ((cd + 1) % 4) as Dir;
        setDir(cd);
      } else {
        const [dx, dy] = DELTA[cd];
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= level.size || ny >= level.size || isWall(nx, ny)) {
          setRunning(false);
          setActiveStep(null);
          setStatus({ kind: "fail", msg: `Aduh! Tahu Bot menabrak ${nx < 0 || ny < 0 || nx >= level.size || ny >= level.size ? "batas arena" : "dinding"} di langkah blok #${act.blockIdx + 1}.` });
          return;
        }
        cx = nx;
        cy = ny;
        setPos([cx, cy]);
        if (isStar(cx, cy)) {
          got.add(`${cx},${cy}`);
          setCollected([...got]);
        }
      }

      step++;
      timerRef.current = window.setTimeout(tick, 260);
    };

    timerRef.current = window.setTimeout(tick, 180);
  };

  return (
    <div className="space-y-5">
      {/* Level Selector */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {LEVELS.map((lv, idx) => {
          const cleared = stats.botLevelsCleared.includes(lv.id);
          return (
            <button
              key={lv.id}
              type="button"
              onClick={() => setLvlIdx(idx)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-2 text-xs font-extrabold transition-all ${
                idx === lvlIdx ? "bg-sun-400 shadow-hard-sm" : "bg-paper hover:bg-sun-50"
              }`}
            >
              <span>Lv.{lv.id} {lv.name}</span>
              {cleared && <CheckCircle2 className="size-3.5 text-[#1d7a46]" />}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Arena Grid */}
        <div className="card flex flex-col items-center bg-paper p-4 sm:p-6">
          <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-xs font-bold text-ink-3">LEVEL {level.id} · TARGET ≤ {level.par} BLOK</p>
              <h3 className="text-lg font-extrabold">{level.name}</h3>
            </div>
            <span className="chip !bg-sun-100">⭐ {collected.length}/{level.stars.length} bintang</span>
          </div>

          <div
            className="grid w-full max-w-[340px] gap-1.5 rounded-2xl border-2 border-ink bg-cream p-2.5 shadow-hard-sm"
            style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: level.size * level.size }).map((_, i) => {
              const x = i % level.size;
              const y = Math.floor(i / level.size);
              const wall = isWall(x, y);
              const goal = x === level.goal[0] && y === level.goal[1];
              const bot = x === pos[0] && y === pos[1];
              const star = isStar(x, y) && !collected.includes(`${x},${y}`);
              return (
                <div
                  key={`${x}-${y}`}
                  className={`relative grid aspect-square place-items-center rounded-xl border-2 text-lg font-extrabold transition-colors ${
                    wall
                      ? "border-ink bg-ink text-paper/40"
                      : goal
                        ? "border-ink bg-[#dff5e7]"
                        : "border-ink/20 bg-paper"
                  }`}
                >
                  {wall && "🧱"}
                  {!wall && goal && !bot && <span title="Tujuan">🏁</span>}
                  {!wall && star && !bot && <span className="animate-pulse">⭐</span>}
                  {bot && (
                    <div
                      className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-sun-400 text-base shadow-hard-sm transition-transform duration-200 sm:size-11"
                      style={{ transform: `rotate(${ROT_DEG[dir]}deg)` }}
                      title="Tahu Bot"
                    >
                      <ArrowUp className="size-5 text-ink" strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          <div
            className={`mt-4 w-full rounded-xl border-2 border-ink p-3.5 text-sm font-semibold ${
              status.kind === "win" ? "bg-[#dff5e7]" : status.kind === "fail" ? "bg-[#ffe4dc]" : "bg-sun-50"
            }`}
          >
            {status.msg}
          </div>

          {status.kind === "win" && lvlIdx < LEVELS.length - 1 && (
            <button type="button" onClick={() => setLvlIdx((i) => i + 1)} className="btn btn-primary mt-3 w-full sm:w-auto">
              <Sparkles className="size-4" /> Lanjut Level {lvlIdx + 2}
            </button>
          )}
        </div>

        {/* Panel Susun Perintah (Ramah HP!) */}
        <div className="card flex flex-col bg-paper p-4 sm:p-5">
          <p className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">1. Tap untuk tambah perintah</p>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {(["FWD", "FWD2", "FWD3", "LEFT", "RIGHT"] as Cmd[]).map((cmd) => (
              <button
                key={cmd}
                type="button"
                disabled={running}
                onClick={() => setProgram((p) => (p.length < 18 ? [...p, cmd] : p))}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-ink bg-sun-100 px-2 py-2.5 text-xs font-extrabold shadow-hard-sm transition-transform active:translate-y-0.5 disabled:opacity-50"
              >
                <span className="font-mono text-sm">{CMD_META[cmd].short}</span>
                <span className="mt-0.5 text-[11px]">{CMD_META[cmd].label}</span>
              </button>
            ))}
            <button
              type="button"
              disabled={running || program.length === 0}
              onClick={() => setProgram((p) => p.slice(0, -1))}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-ink bg-[#ffe4dc] px-2 py-2.5 text-xs font-extrabold disabled:opacity-40"
            >
              <Trash2 className="size-4" />
              <span className="mt-0.5 text-[11px]">Hapus 1</span>
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">2. Susunan Program ({program.length}/18)</p>
            {program.length > 0 && (
              <button type="button" disabled={running} onClick={() => { setProgram([]); resetBoard(); }} className="text-xs font-bold text-ink-3 hover:underline">
                Kosongkan
              </button>
            )}
          </div>

          <div className="mt-2 min-h-[120px] flex-1 rounded-xl border-2 border-ink bg-ink p-3 font-mono text-xs text-paper">
            {program.length === 0 ? (
              <p className="text-paper/50"># Tap tombol perintah di atas untuk mulai menyusun algoritma Tahu Bot…</p>
            ) : (
              <ol className="space-y-1">
                {program.map((c, idx) => (
                  <li
                    key={idx}
                    onClick={() => !running && setProgram((p) => p.filter((_, k) => k !== idx))}
                    className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1 transition-colors ${
                      activeStep === idx ? "bg-sun-400 font-bold text-ink" : "hover:bg-paper/10"
                    }`}
                    title="Tap untuk menghapus baris ini"
                  >
                    <span>
                      <span className="mr-2 opacity-50">{idx + 1}.</span>
                      {CMD_META[c].code}
                    </span>
                    <span className="text-[10px] opacity-60">×</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => resetBoard()} className="btn btn-ghost flex-1 !py-2.5 !text-xs">
              <RotateCcw className="size-4" /> Reset Posisi
            </button>
            <button
              type="button"
              disabled={running || program.length === 0}
              onClick={runProgram}
              className="btn btn-primary flex-[1.5] !py-2.5 !text-xs disabled:opacity-50"
            >
              {running ? <RotateCw className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}
              {running ? "Menjalankan..." : "Jalankan Bot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
