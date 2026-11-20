"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* clipboard diblokir */ }
      }}
      className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-paper/70 transition-colors hover:bg-paper/10 hover:text-paper"
      aria-label="Salin kode"
    >
      {ok ? <Check className="size-3.5 text-sun-400" /> : <Copy className="size-3.5" />}
      {ok ? "Tersalin" : "Salin"}
    </button>
  );
}
