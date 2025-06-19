import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns:
      [
        {
          protocol: "https",
          hostname: "image.tmdb.org"
        },
        {
          protocol: "https",
          hostname: "www.themoviedb.org",
        },
        {
          protocol: "https",
          hostname: "d2luv1saso99wi.cloudfront.net",
        }
      ]
    ,
    domains: ['tudominio.com', 'cloudfront.net'],
  }
};

export default nextConfig;
