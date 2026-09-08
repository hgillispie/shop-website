import type { NextConfig } from "next";
import { REVIEW_REDIRECT } from "./lib/google-review";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [REVIEW_REDIRECT];
  },
};

export default nextConfig;
