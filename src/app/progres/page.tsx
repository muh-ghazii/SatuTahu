import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { ProgressSyncBanner } from "@/components/auth/SyncBadge";

export const metadata: Metadata = { title: "Progres Saya", description: "Pantau progres belajarmu di semua jalur SatuTahu." };

export default function ProgresPage() {
  return (
    <div className="container-page pt-12">
      <span className="eyebrow">Progres saya</span>
      <h1 className="mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl">Sejauh mana kamu sudah melangkah?</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">Ringkasan semua jalur yang sedang kamu pelajari. Tanpa akun progres tersimpan di browser ini; dengan akun, progres ikut tersimpan dan tersinkron di semua perangkatmu.</p>
      <ProgressSyncBanner />
      <ProgressDashboard />
    </div>
  );
}
