import type { Metadata } from "next";
import { AccountView } from "@/components/auth/AccountView";

export const metadata: Metadata = { title: "Akun saya", robots: { index: false } };

export default function AkunPage() {
  return (
    <div className="container-page py-12">
      <span className="eyebrow">Akun</span>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Akun saya</h1>
      <AccountView />
    </div>
  );
}
