import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
        port: "",
        pathname: "/**",
      },
    ],
  },
  typedRoutes: true,
  experimental: {
    browserDebugInfoInTerminal: true,
    viewTransition: true,
    typedEnv: true,
  },
};

export default nextConfig;