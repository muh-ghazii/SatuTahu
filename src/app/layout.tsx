import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "SatuTahu: Belajar Teknologi Gratis, Modul Berbahasa Indonesia",
    template: "%s · SatuTahu",
  },
  description:
    "Modul belajar Software Development, Data & AI, Jaringan, DevOps, Cyber Security, dan IoT yang disusun dari repositori GitHub terbaik. Gratis, bertahap, interaktif, dan berbahasa Indonesia.",
  keywords: ["belajar coding gratis", "roadmap programmer", "machine learning", "data science", "frontend", "backend", "github", "bahasa indonesia"],
  openGraph: {
    title: "SatuTahu: Belajar Teknologi Gratis, Modul Berbahasa Indonesia",
    description: "19 jalur, 100 modul interaktif berbahasa Indonesia, sumber asli tetap dikreditkan.",
    images: ["/logo.png"],
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fec536",
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
        </AuthProvider>
      </body>
    </html>
  );
}
