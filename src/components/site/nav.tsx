"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardList, Home, LogOut, PlusCircle, Shield, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalCurrentUser, logoutLocalUser, type LocalAuthUser } from "@/lib/local-auth";
import { cn } from "@/lib/utils";

const desktopNavItems = [
  { href: "/", label: "首页" },
  { href: "/escorts", label: "护航师" },
  { href: "/orders/create", label: "发布订单" },
  { href: "/orders", label: "订单中心" },
  { href: "/chat", label: "聊天" },
  { href: "/user", label: "用户中心" },
  { href: "/admin", label: "管理后台" },
];

const mobileNavItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/escorts", label: "护航师", icon: Shield },
  { href: "/orders/create", label: "下单", icon: PlusCircle },
  { href: "/orders", label: "订单", icon: ClipboardList },
  { href: "/user", label: "我的", icon: UserRound },
];

export function SiteNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<LocalAuthUser | null>(null);

  useEffect(() => {
    function syncUser() {
      setCurrentUser(getLocalCurrentUser());
    }

    syncUser();
    window.addEventListener("delta-escort-auth-change", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("delta-escort-auth-change", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  function handleLogout() {
    logoutLocalUser();
  }

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/orders") {
      return pathname === "/orders";
    }

    if (href === "/orders/create") {
      return pathname.startsWith("/orders/create");
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <ShieldCheck className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate text-base font-bold tracking-wide">Delta Escort</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground lg:flex">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("hover:text-foreground", isActive(item.href) ? "text-primary" : null)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {currentUser ? (
              <>
                <Link href="/user" className="hidden max-w-32 truncate text-sm text-muted-foreground sm:inline">
                  {currentUser.nickname}
                </Link>
                <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">退出</span>
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/login">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  登录
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] text-muted-foreground",
                  active ? "bg-primary/10 text-primary" : "hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
