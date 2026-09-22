const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  async redirects() {
    return [
      {
        source: "/dashboard/activity-history",
        destination: "/dashboard/activity",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    // Opt-in local auth bypass: when USE_CLERK_MOCK=1, resolve Clerk to the
    // in-repo mocks so the app runs without external Clerk credentials.
    // Default behavior (real Clerk keys) is unchanged when the flag is unset.
    if (process.env.USE_CLERK_MOCK === "1") {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@clerk/nextjs/server$": path.resolve(__dirname, "lib/clerk-server-mock.ts"),
        "@clerk/nextjs$": path.resolve(__dirname, "lib/clerk-mock.tsx"),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
