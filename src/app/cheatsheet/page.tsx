import type { Metadata } from "next";
import { Suspense } from "react";
import { CheatsheetHub } from "@/components/CheatsheetHub";

export const metadata: Metadata = {
  title: "Cheatsheet & Flashcard 19 Jalur",
  description: "Contekan cepat syntax, perintah terminal, pola kode, kesalahan umum pemula, dan 114 flashcard interaktif untuk seluruh 19 jalur teknologi SatuTahu.",
};

export default function CheatsheetPage() {
  return (
    <div className="container-page pt-8 sm:pt-12">
      <span className="eyebrow">Ringkasan cepat &amp; hafalan aktif</span>
      <h1 className="mt-4 max-w-3xl text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        Cheatsheet &amp; Flashcard untuk semua 19 jalur.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
        Butuh pengingat cepat sebelum ngoding, ujian, atau wawancara? Salin pola penting, hindari jebakan klasik pemula, dan uji ingatanmu lewat kartu flashcard interaktif.
      </p>
      <div className="mt-8 sm:mt-10">
        <Suspense fallback={<div className="card h-96 animate-pulse bg-paper" />}>
          <CheatsheetHub />
        </Suspense>
      </div>
    </div>
  );
}
