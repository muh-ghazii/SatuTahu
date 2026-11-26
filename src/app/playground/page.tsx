import type { Metadata } from "next";
import { Playground } from "@/components/Playground";

export const metadata: Metadata = {
  title: "Coding Playground Live",
  description: "Tulis, ubah, dan jalankan kode HTML, CSS, dan JavaScript langsung di browser lengkap dengan tantangan latihan berpenilai otomatis.",
};

export default function PlaygroundPage() {
  return (
    <div className="container-page pt-8 sm:pt-12">
      <span className="eyebrow">Lab praktik langsung</span>
      <h1 className="mt-4 max-w-3xl text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        Coding Playground, langsung jalan di browser.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
        Coba langsung HTML, CSS, dan JavaScript tanpa instalasi apa pun — lengkap dengan preview ukuran HP/desktop, console, dan tantangan algoritma berpenilai otomatis.
      </p>
      <div className="mt-7 sm:mt-9">
        <Playground />
      </div>
    </div>
  );
}
