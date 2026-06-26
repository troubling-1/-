"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { EscortApplication } from "@/lib/types";

const statusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

const userCenterItems = [
  { title: "个人资料", text: "昵称、头像、手机号和登录账号。", href: "/center/profile" },
  { title: "订单记录", text: "查看历史订单和当前订单状态。", href: "/orders" },
  { title: "评价记录", text: "查看已发布评价和待评价订单。", href: "/center/reviews" },
  { title: "钱包", text: "余额、消费记录和退款记录。", href: "/center/wallet" },
  { title: "设置", text: "通知、隐私和账号安全。", href: "/center/settings" },
  { title: "成为护航师", text: "提交入驻资料并等待平台审核。", href: "/join" },
];

export function CenterPageContent() {
  return (
    <RoleGate allowedRoles={["customer", "escort", "admin"]}>
      <CenterInner />
    </RoleGate>
  );
}

function CenterInner() {
  const [application, setApplication] = useState<EscortApplication | null>(null);

  useEffect(() => {
    async function loadApplication() {
      const token = await getCurrentAccessToken();

      if (!token) {
        return;
      }

      const response = await fetch("/api/join", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as { data: EscortApplication | null };
      setApplication(result.data);
    }

    loadApplication();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-3xl font-bold">用户中心</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">管理资料、订单、评价、钱包和护航师入驻申请。</p>

      {application ? (
        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold">护航师申请状态</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {application.nickname} / {application.rank} / {new Date(application.created_at).toLocaleString("zh-CN")}
                </p>
                {application.status === "rejected" && application.reject_reason ? (
                  <p className="mt-2 text-sm text-destructive">拒绝原因：{application.reject_reason}</p>
                ) : null}
              </div>
              <Badge tone={application.status === "approved" ? "success" : application.status === "pending" ? "warning" : "muted"}>
                {statusText[application.status]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6">
        <ContactServiceCard compact />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userCenterItems.map((item) => (
          <Link key={item.title} href={item.href} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/60">
              <CardHeader className="p-4 sm:p-5">
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
                <p className="mt-4 text-sm text-primary">进入查看</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
