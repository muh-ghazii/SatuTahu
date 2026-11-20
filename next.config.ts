import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan membuka dev server dari alamat jaringan lokal (bukan hanya localhost).
  // Tambahkan IP lain di sini bila membuka dari HP/laptop lain.
  allowedDevOrigins: ["192.168.56.1"],
  cacheComponents: true,
  partialPrefetching: true,
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
