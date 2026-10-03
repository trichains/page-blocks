import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The leads API validates submissions against the published form config, which it
  // reads from content/pages at request time. Make sure those files ship with it.
  outputFileTracingIncludes: {
    "/api/leads": ["./content/pages/**/*.json"],
  },
  poweredByHeader: false,
};

export default nextConfig;
