import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
    disallow: ["/dashboard", "/api"],
  },
  sitemap: "https://myfastbird.com/sitemap.xml",
  host: "https://myfastbird.com",
});

export default robots;
