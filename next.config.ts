import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isProd ? "/jp-keigo" : "",
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
