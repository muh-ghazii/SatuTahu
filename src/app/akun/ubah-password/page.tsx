import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { UpdatePasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Ubah password", robots: { index: false } };

export default function UbahPasswordPage() {
  return (
    <AuthShell>
      <UpdatePasswordForm />
    </AuthShell>
  );
}
