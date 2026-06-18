import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "FastBird",
  short_name: "FastBird",
  description:
    "Travel data that just works — instant eSIM data plans by destination, on a simple prepaid Points balance.",
  start_url: "/",
  display: "standalone",
  background_color: "#FBFAF6",
  theme_color: "#1D4D3A",
  icons: [
    {
      src: "/images/brand/favicon.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/images/brand/app-icon.png",
      sizes: "1024x1024",
      type: "image/png",
      purpose: "any",
    },
  ],
});

export default manifest;
