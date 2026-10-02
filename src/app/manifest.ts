import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Toronto Postcards",
    short_name: "Postcards",
    description: "Quick-capture postcards around Toronto.",
    start_url: "/add",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#f7f3ea",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
