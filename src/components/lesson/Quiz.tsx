"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, RotateCcw, Sparkles, X } from "lucide-react";
import type { QuizItem } from "@/lib/modules";
import { recordStudyAction } from "@/lib/gamification";

export function Quiz({ items }: { items: QuizItem[] }) {
  const [ans, setAns] = useState<(number | null)[]>(items.map(() => null));
  const [rewarded, setRewarded] = useState(false);
  const done = ans.filter((a) => a !== null).length;
  const score = ans.filter((a, i) => a === items[i].answer).length;

  const pick = (qi: number, oi: number) => {
    const next = ans.map((x, k) => (k === qi ? oi : x));
    setAns(next);
    if (!rewarded && next.every((x) => x !== null)) {
      setRewarded(true);
      const nextScore = next.filter((a, i) => a === items[i].answer).length;
      const perfect = nextScore === items.length;
      const xp = nextScore * 10 + (perfect ? 30 : 10);
      recordStudyAction(
        (s) => ({
          quizzesCompleted: s.quizzesCompleted + 1,
          perfectQuizzes: s.perfectQuizzes + (perfect ? 1 : 0),
        }),
        xp,
      );
    }
  };

  return (
    <section id="kuis" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Cek pemahaman</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-[28px]">Kuis singkat</h2>
        </div>
        {done > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border-2 border-ink bg-sun-300 px-3 py-1 font-mono text-sm font-bold">{score}/{items.length} benar</span>
            {done === items.length && rewarded && (
              <span className="chip !bg-[#dff5e7]"><Sparkles className="size-3.5" /> +{score * 10 + (score === items.length ? 30 : 10)} XP</span>
            )}
            <button onClick={() => setAns(items.map(() => null))} className="chip !px-3 !py-1.5 hover:bg-cream"><RotateCcw className="size-3" /> Ulangi</button>
          </div>
        )}
      </div>
      <ol className="mt-6 space-y-5">
        {items.map((it, qi) => {
          const a = ans[qi];
          return (
            <li key={qi} className="card p-4 sm:p-5">
              <p className="font-bold leading-relaxed [overflow-wrap:anywhere]"><span className="mr-2 font-mono text-ink-3">{qi + 1}.</span>{it.q}</p>
              <div className="mt-4 grid min-w-0 grid-cols-1 gap-2">
                {it.options.map((o, oi) => {
                  const picked = a === oi, correct = oi === it.answer, show = a !== null;
                  return (
                    <button
                      key={oi}
                      disabled={show}
                      onClick={() => pick(qi, oi)}
                      className={`flex min-w-0 items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left text-[15px] transition-colors sm:px-4 sm:py-2.5 ${
                        show && correct ? "border-ink bg-[#dff5e7]" : show && picked ? "border-ink bg-[#ffe4dc]" : show ? "border-line bg-paper text-muted" : "border-line bg-paper hover:border-ink hover:bg-sun-50"
                      }`}
                    >
                      <span className={`grid size-6 shrink-0 place-items-center rounded-md border-2 border-ink font-mono text-xs font-bold ${show && correct ? "bg-[#2fb36b] text-paper" : show && picked ? "bg-[#d9534f] text-paper" : "bg-cream"}`}>
                        {show && correct ? <Check className="size-3.5" strokeWidth={3} /> : show && picked ? <X className="size-3.5" strokeWidth={3} /> : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="min-w-0 [overflow-wrap:anywhere]">{o}</span>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {a !== null && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className={`mt-3 rounded-lg p-3 text-sm leading-relaxed ${a === it.answer ? "bg-[#dff5e7]" : "bg-sun-100"}`}>
                    <span className="font-bold">{a === it.answer ? "Tepat! " : "Belum tepat. "}</span>{it.explain}
                  </motion.p>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
