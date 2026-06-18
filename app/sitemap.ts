import type { MetadataRoute } from "next";
import { destinations } from "@/constants/destinations";

const BASE = "https://myfastbird.com";

const sitemap = (): MetadataRoute.Sitemap => {
  const staticRoutes = [
    "",
    "/products",
    "/pricing",
    "/story",
    "/faq",
    "/contact",
    "/payments",
    "/activities",
    "/privacy-policy",
    "/terms-and-conditions",
    "/cookies-policy",
    "/return-policy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const destinationRoutes = destinations.map((d) => ({
    url: `${BASE}/products/${d.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...destinationRoutes];
};

export default sitemap;
