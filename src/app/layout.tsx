import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Delta Escort - 三角洲行动护航陪玩平台",
    template: "%s | Delta Escort",
  },
  description:
    "Delta Escort 是三角洲行动护航接单平台，支持带撤离、战备物资护送、上分陪玩、娱乐陪玩、订单评价和举报管理。",
  keywords: [
    "三角洲行动护航",
    "三角洲行动陪玩",
    "三角洲行动带撤离",
    "战备物资护送",
    "上分陪玩",
    "Delta Escort",
  ],
  applicationName: "Delta Escort",
  authors: [{ name: "Delta Escort" }],
  creator: "Delta Escort",
  publisher: "Delta Escort",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: "Delta Escort",
    title: "Delta Escort - 三角洲行动护航陪玩平台",
    description: "深色军事科技风护航接单平台，覆盖带撤离、物资护送、上分陪玩、评价与举报管理。",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delta Escort - 三角洲行动护航陪玩平台",
    description: "三角洲行动护航、带撤离、物资护送、上分陪玩和娱乐陪玩接单平台。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <body>
        <SiteNav />
        <main className="pb-20 lg:pb-0">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
