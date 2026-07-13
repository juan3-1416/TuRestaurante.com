import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Permitir HMR y scripts de desarrollo desde la IP local del teléfono
  allowedDevOrigins: ["192.168.100.122"],
};

export default nextConfig;
