import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan membuka dev server dari alamat jaringan lokal (bukan hanya localhost).
  // Tambahkan IP lain di sini bila membuka dari HP/laptop lain.
  allowedDevOrigins: ["192.168.56.1"],
  cacheComponents: true,
  partialPrefetching: true,
  // Header keamanan untuk semua halaman (diterapkan oleh Next.js, sehingga ikut terkirim di Netlify).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
