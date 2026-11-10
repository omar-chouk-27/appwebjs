import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [
    "10.230.207.96",
    "10.10.250.168",
    "192.168.1.11",
    "localhost",
  ],
};

export default nextConfig;
