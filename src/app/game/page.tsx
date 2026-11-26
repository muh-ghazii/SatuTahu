import type { Metadata } from "next";
import { GameArena } from "@/components/games/GameArena";

export const metadata: Metadata = {
  title: "Arena Game Coding Interaktif",
  description: "Belajar logika pemrograman sambil bermain: Tahu Bot (logika grid), Susun Kode (Parsons puzzle), Bug Hunter & Tebak Output, serta SQL, Git, dan CSS Flexbox Quest.",
};

export default function GamePage() {
  return (
    <div className="container-page pt-8 sm:pt-12">
      <span className="eyebrow">Main sambil ngoding</span>
      <h1 className="mt-4 max-w-3xl text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        Arena Game Coding SatuTahu.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
        Asah logika, insting debugging, SQL, Git, dan CSS lewat 4 mini-game interaktif yang ramah HP maupun desktop. Setiap level memberi XP untuk menaikkan level &amp; membuka lencana!
      </p>
      <div className="mt-7 sm:mt-9">
        <GameArena />
      </div>
    </div>
  );
}
