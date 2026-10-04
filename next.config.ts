import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp is a native module; keep it out of the server bundle.
  serverExternalPackages: ["sharp"],
  // The Shoebox became the Scrapbook; keep old links working.
  async redirects() {
    return [{ source: "/shoebox", destination: "/scrapbook", permanent: true }];
  },
  experimental: {
    // Client-compressed photos (~1–2 MB) go through server actions.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
