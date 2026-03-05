import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  logging: { fetches: { fullUrl: false } },
  serverExternalPackages: [
    "genkit",
    "@genkit-ai/googleai",
    "@opentelemetry/sdk-node",
    "@opentelemetry/exporter-jaeger",
  ],
};

export default nextConfig;
