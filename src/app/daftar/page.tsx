import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Daftar", description: "Buat akun SatuTahu gratis untuk menyimpan progres belajar di semua perangkat." };

export default function DaftarPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="card h-[640px] w-full max-w-md animate-pulse" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
