import type { MetadataRoute } from "next";
import { escorts } from "@/lib/mock-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/escorts", "/orders/create", "/orders", "/user", "/escort/apply", "/admin"];
  const escortRoutes = escorts.map((escort) => `/escorts/${escort.id}`);

  return [...staticRoutes, ...escortRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
