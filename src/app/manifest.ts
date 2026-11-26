import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SatuTahu — Belajar Teknologi Gratis Berbahasa Indonesia",
    short_name: "SatuTahu",
    description:
      "19 jalur belajar, 100 modul interaktif, Coding Playground, Arena Game Coding, Cheatsheet & Flashcard, serta 340+ rujukan GitHub, buku & web gratis.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fdf9ee",
    theme_color: "#fec536",
    lang: "id",
    categories: ["education", "developer tools"],
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/mascot.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Jalur Belajar", url: "/jalur", description: "Buka 19 jalur roadmap belajar" },
      { name: "Arena Game Coding", url: "/game", description: "Main Tahu Bot, Susun Kode & Bug Hunter" },
      { name: "Coding Playground", url: "/playground", description: "Coba HTML, CSS & JS langsung" },
      { name: "Progres Saya", url: "/progres", description: "Cek XP, streak & bookmark" },
    ],
  };
}
