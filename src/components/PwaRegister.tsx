"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

type BeforeInstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "satutahu:pwa-dismissed:v1";

export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;

    const wasDismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    setDismissed(wasDismissed);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIos && !wasDismissed) {
      setShowIosHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setShowIosHint(false);
    setDeferred(null);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* abaikan */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (dismissed || (!deferred && !showIosHint)) return null;

  return (
    <div className="fixed right-3 bottom-[76px] left-3 z-40 mx-auto max-w-md lg:right-5 lg:bottom-5 lg:left-auto">
      <div className="card flex items-center gap-3 bg-sun-100 p-3 shadow-hard">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-sun-400">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold">Pasang SatuTahu di HP</p>
          <p className="text-[11px] leading-snug text-ink-2">
            {deferred
              ? "Buka lebih cepat layar penuh seperti aplikasi native."
              : "Di Safari: ketuk ikon Bagikan lalu pilih 'Tambah ke Layar Utama'."}
          </p>
        </div>
        {deferred && (
          <button type="button" onClick={install} className="btn btn-primary shrink-0 !px-3 !py-1.5 !text-xs">
            <Download className="size-3.5" /> Pasang
          </button>
        )}
        <button type="button" onClick={dismiss} aria-label="Tutup banner pasang" className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-sun-200">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
