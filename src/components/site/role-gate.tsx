"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAuthSessionState } from "@/lib/auth-client";
import type { UserRole } from "@/lib/types";

type RoleGateProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);
  const allowedRoleKey = useMemo(() => allowedRoles.join(","), [allowedRoles]);

  useEffect(() => {
    let cancelled = false;

    async function checkRole() {
      try {
        const { profile } = await getAuthSessionState();

        if (!profile) {
          router.replace("/login");
          return;
        }

        if (!allowedRoles.includes(profile.role)) {
          router.replace("/403");
          return;
        }

        if (!cancelled) {
          setAllowed(true);
        }
      } catch {
        router.replace("/login");
      } finally {
        if (!cancelled) {
          setChecked(true);
        }
      }
    }

    checkRole();

    return () => {
      cancelled = true;
    };
  }, [allowedRoleKey, allowedRoles, router]);

  if (!checked) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">正在校验登录权限...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">正在跳转...</p>
        <Button asChild className="mt-4">
          <Link href="/login">返回登录</Link>
        </Button>
      </div>
    );
  }

  return children;
}
