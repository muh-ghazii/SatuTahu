import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "SatuTahu: Belajar Teknologi Gratis, Modul & Game Coding Berbahasa Indonesia",
    template: "%s · SatuTahu",
  },
  description:
    "Platform belajar teknologi gratis berbahasa Indonesia: 19 jalur, 100 modul interaktif, Arena Game Coding, Coding Playground, Cheatsheet & Flashcard, serta 340+ rujukan GitHub, buku & web.",
  keywords: ["belajar coding gratis", "roadmap programmer", "game coding", "machine learning", "data science", "frontend", "backend", "github", "bahasa indonesia"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SatuTahu",
  },
  openGraph: {
    title: "SatuTahu: Belajar Teknologi Gratis, Modul & Game Coding Berbahasa Indonesia",
    description: "19 jalur, 100 modul interaktif, Arena Game Coding, Coding Playground, dan rujukan GitHub, buku & web.",
    images: ["/logo.png"],
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fec536",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col">
        <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          Lewati ke konten
        </a>
        <AuthProvider>
          <Navbar />
          <main id="konten" className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
          <PwaRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
