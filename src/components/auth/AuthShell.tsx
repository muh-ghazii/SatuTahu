import Image from "next/image";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

const benefits = ["Progres tersimpan di akun, lanjutkan di perangkat mana pun", "Masuk cepat dengan akun Google", "Tetap gratis, tanpa iklan"];

/** Tata letak halaman masuk/daftar: panel maskot di kiri, formulir di kanan. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="container-page grid items-center gap-10 py-10 lg:min-h-[calc(100vh-72px-120px)] lg:grid-cols-[1fr_1fr] lg:py-16">
      <div className="hidden lg:block">
        <div className="relative mx-auto max-w-md">
          <div className="absolute inset-x-6 top-4 bottom-10 rounded-[40px] border-2 border-ink bg-sun-400" />
          <Image src="/hero-mascot.png" alt="" width={720} height={567} className="relative z-10 mx-auto w-[85%] pt-2" />
        </div>
        <ul className="mx-auto mt-8 max-w-md space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3 font-semibold">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 border-ink bg-sun-300"><Check className="size-3.5" /></span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-w-0 justify-center">{children}</div>
    </div>
  );
}
