"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardList, Home, LogOut, PlusCircle, Shield, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAuthProfile } from "@/lib/auth-client";
import { logoutLocalUser, type LocalAuthUser } from "@/lib/local-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/", label: "首页" },
  { href: "/escorts", label: "护航师" },
  { href: "/orders/create", label: "发布订单" },
  { href: "/services", label: "服务介绍" },
  { href: "/faq", label: "常见问题" },
];

const mobileNavItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/escorts", label: "护航师", icon: Shield },
  { href: "/orders/create", label: "下单", icon: PlusCircle },
  { href: "/orders", label: "订单", icon: ClipboardList },
  { href: "/center", label: "我的", icon: UserRound },
];

function getRoleNavItems(currentUser: LocalAuthUser | null) {
  if (!currentUser) {
    return baseNavItems;
  }

  if (currentUser.role === "admin") {
    return [...baseNavItems, { href: "/admin", label: "管理后台" }];
  }

  if (currentUser.role === "escort") {
    return [...baseNavItems, { href: "/escort/dashboard", label: "护航师后台" }, { href: "/orders", label: "订单中心" }];
  }

  return [...baseNavItems, { href: "/center", label: "用户中心" }, { href: "/join", label: "申请成为护航师" }];
}

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<LocalAuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncUserFromSupabase() {
      try {
        const profile = await fetchAuthProfile();

        if (!cancelled && profile) {
          setCurrentUser({
            id: profile.id,
            email: "",
            nickname: profile.nickname,
            role: profile.role,
            status: profile.status,
            created_at: profile.created_at,
          });
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      }
    }

    syncUserFromSupabase();
    window.addEventListener("delta-escort-auth-change", syncUserFromSupabase);
    window.addEventListener("storage", syncUserFromSupabase);

    return () => {
      cancelled = true;
      window.removeEventListener("delta-escort-auth-change", syncUserFromSupabase);
      window.removeEventListener("storage", syncUserFromSupabase);
    };
  }, []);

  async function handleLogout() {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      logoutLocalUser();
      setCurrentUser(null);
      router.push("/login");
      router.refresh();
    }
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

  const desktopNavItems = getRoleNavItems(currentUser);

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
              <Link key={item.href} href={item.href} className={cn("hover:text-foreground", isActive(item.href) ? "text-primary" : null)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {currentUser ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={currentUser.role === "admin" ? "/admin" : currentUser.role === "escort" ? "/escort/dashboard" : "/center"}>
                    {currentUser.role === "admin" ? "管理后台" : currentUser.role === "escort" ? "护航师后台" : "用户中心"}
                  </Link>
                </Button>
                {currentUser.role === "customer" ? (
                  <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                    <Link href="/join">申请成为护航师</Link>
                  </Button>
                ) : null}
                {currentUser.role === "escort" ? (
                  <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                    <Link href="/orders">订单中心</Link>
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">退出登录</span>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">登录</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">注册</Link>
                </Button>
              </>
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
