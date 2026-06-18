const webpack = require("webpack");
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias["@clerk/nextjs/server"] = path.resolve(
      __dirname,
      "lib/clerk-server-mock.ts"
    );
    config.resolve.alias["@clerk/nextjs"] = path.resolve(
      __dirname,
      "lib/clerk-mock.tsx"
    );
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
        port: "",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
