import type { NextConfig } from "next";
import { GOOGLE_REVIEW_URL } from "./lib/site-url";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/review",
        destination: GOOGLE_REVIEW_URL,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
