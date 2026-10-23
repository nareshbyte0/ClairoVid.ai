import type { NextConfig } from "next";
const config: NextConfig = { serverExternalPackages: ["mongodb"], distDir: ".next-build" };
export default config;
