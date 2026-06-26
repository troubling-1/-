import Link from "next/link";

const footerLinks = [
  { href: "/services", label: "服务介绍" },
  { href: "/rules", label: "平台规则" },
  { href: "/faq", label: "常见问题" },
  { href: "/join", label: "护航师入驻" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-black/30">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-muted-foreground md:grid-cols-4">
        <div>
          <p className="font-semibold text-foreground">Delta Escort</p>
          <p className="mt-2 leading-6">三角洲行动护航陪玩接单平台，支持带撤离、物资护送、上分护航和娱乐陪玩。</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">服务</p>
          <p className="mt-2 leading-6">护航、带撤离、物资护送、上分陪玩、娱乐陪玩。</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">站内入口</p>
          <div className="mt-2 grid gap-2">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground">合规提示</p>
          <p className="mt-2 leading-6">平台只提供陪玩撮合与订单管理，不售卖游戏外挂或违规服务。请勿私下交易。</p>
        </div>
      </div>
    </footer>
  );
}
