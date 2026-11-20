import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

export default function MasukPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="card h-[520px] w-full max-w-md animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
