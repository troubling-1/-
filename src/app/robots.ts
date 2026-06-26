import type { MetadataRoute } from "next";

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

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/chat", "/login", "/register", "/orders", "/user", "/center"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
