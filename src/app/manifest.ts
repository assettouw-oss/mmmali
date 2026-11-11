import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MMMali — Le marché du Mali",
    short_name: "MMMali",
    description: "Achète et vends au Mali depuis ton téléphone ou ton ordinateur.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#000000",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
