import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns: [
      {protocol: "http",
        hostname:"www.w3.org/2000/svg"
      }
    ]
  }
};

export default nextConfig;
