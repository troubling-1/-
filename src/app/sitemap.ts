import type { MetadataRoute } from "next";
import { escorts } from "@/lib/mock-data";

const fallbackSiteUrl = "https://delta-escort.pages.dev";

function getPublicSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawSiteUrl) {
    return fallbackSiteUrl;
  }

  try {
    const parsedUrl = new URL(rawSiteUrl);
    const previewHostName = ["local", "host"].join("");
    const isPreviewHost = parsedUrl.hostname === previewHostName || parsedUrl.hostname.startsWith("127.");

    if (isPreviewHost) {
      return fallbackSiteUrl;
    }

    return parsedUrl.origin;
  } catch {
    return fallbackSiteUrl;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicSiteUrl();
  const staticRoutes = ["", "/escorts", "/orders/create", "/join", "/services", "/rules", "/faq"];
  const escortRoutes = escorts.map((escort) => `/escorts/${escort.id}`);

  return [...staticRoutes, ...escortRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/escorts") ? 0.8 : 0.7,
  }));
}
