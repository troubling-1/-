import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://delta-escort.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Delta Escort - 三角洲行动护航陪玩平台",
    template: "%s | Delta Escort",
  },
  description:
    "Delta Escort 是面向中国大陆玩家的三角洲行动护航陪玩平台，提供带撤离、战备物资护送、上分护航、娱乐陪玩、订单售后和客服协助。",
  keywords: [
    "三角洲行动护航",
    "三角洲行动陪玩",
    "三角洲行动带撤离",
    "三角洲行动物资护送",
    "三角洲行动上分",
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
    description: "支持带撤离、物资护送、上分护航和娱乐陪玩，提供订单记录、客服协助、评价和举报入口。",
  },
  robots: {
    index: true,
    follow: true,
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
