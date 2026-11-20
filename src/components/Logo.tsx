import Image from "next/image";
import Link from "next/link";

export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className="text-ink">Satu</span>
      <span className="text-sun-500">Tahu</span>
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="SatuTahu, ke beranda">
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-xl border-2 border-ink bg-sun-300 shadow-hard-sm transition-transform group-hover:-rotate-6">
        <Image src="/mascot.png" alt="" width={40} height={40} className="scale-125 translate-y-0.5" priority />
      </span>
      <Wordmark />
    </Link>
  );
}
