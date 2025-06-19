import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mg.freepik.com',
      },
      {
        protocol: "http",
        hostname: "www.w3.org/2000/svg"
      }
    ]
  }
}
module.exports = nextConfig;

