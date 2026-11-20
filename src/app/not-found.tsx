import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <Image src="/mascot.png" alt="" width={140} height={140} className="rotate-6" />
      <h1 className="mt-6 text-5xl font-extrabold">404</h1>
      <p className="mt-2 text-lg text-muted">Halaman ini belum ada… tahu-tahunya tidak ketemu.</p>
      <Link href="/" className="btn btn-primary mt-8">Kembali ke beranda</Link>
    </div>
  );
}
