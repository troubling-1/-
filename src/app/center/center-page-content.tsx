"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import { todayDeals, userCenterStats } from "@/lib/operation-seed";
import type { EscortApplication, Report } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const statusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

const reportStatusText = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已解决",
  rejected: "已驳回",
};

const baseUserCenterItems = [
  { title: "个人资料", text: "昵称、头像、手机号和登录账号。", href: "/center/profile" },
  { title: "订单记录", text: "查看历史订单和当前订单状态。", href: "/orders" },
  { title: "评价记录", text: "查看已发布评价和待评价订单。", href: "/center/reviews" },
  { title: "提交举报", text: "遇到异常订单、违规评价或私下交易时提交举报。", href: "/reports/new" },
  { title: "钱包", text: "余额、消费记录和退款记录。", href: "/center/wallet" },
  { title: "设置", text: "通知、隐私和账号安全。", href: "/center/settings" },
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
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    async function loadUserCenterData() {
      const token = await getCurrentAccessToken();

      if (!token) {
        return;
      }

      const [applicationResponse, reportsResponse] = await Promise.all([
        fetch("/api/join", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/reports", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (applicationResponse.ok) {
        const result = (await applicationResponse.json()) as { data: EscortApplication | null };
        setApplication(result.data);
      }

      if (reportsResponse.ok) {
        const result = (await reportsResponse.json()) as { data: Report[] };
        setReports(result.data || []);
      }
    }

    loadUserCenterData();
  }, []);

  const escortEntryItem = useMemo(() => {
    if (!application) {
      return { title: "申请成为护航师", text: "提交入驻资料并等待平台审核。", href: "/join" };
    }

    if (application.status === "pending") {
      return { title: "申请审核中", text: "你的护航师入驻申请正在平台审核中。", href: "/join/success" };
    }

    if (application.status === "approved") {
      return { title: "进入护航师后台", text: "管理护航师资料、订单和服务状态。", href: "/escort/dashboard" };
    }

    return { title: "申请未通过，重新提交", text: "查看拒绝原因，完善资料后再次提交。", href: "/join" };
  }, [application]);

  const userCenterItems = [...baseUserCenterItems, escortEntryItem];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-3xl font-bold">用户中心</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">管理资料、订单、评价、举报和护航师入驻申请。</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <UserStat title="累计订单" value={`${userCenterStats.totalOrders}`} text="站内服务记录" />
        <UserStat title="已完成" value={`${userCenterStats.completedOrders}`} text="可评价订单沉淀" />
        <UserStat title="待评价" value={`${userCenterStats.pendingReviews}`} text="完成后提升平台信誉" />
        <UserStat title="售后节省" value={formatMoney(userCenterStats.savedAmount)} text="异常订单协助处理" />
      </div>

      <Card className="mt-6 border-emerald-300/20 bg-emerald-300/[0.05]">
        <CardHeader>
          <CardTitle>最近平台成交</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {todayDeals.slice(0, 3).map((deal) => (
            <div key={deal.id} className="flex flex-col justify-between gap-2 rounded-md border border-white/10 bg-black/25 p-3 text-sm sm:flex-row sm:items-center">
              <p>{deal.user} 下单 {deal.service}，护航师 {deal.escort}</p>
              <p className="text-emerald-300">{deal.status} / {formatMoney(deal.amount)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>我的举报</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {reports.length === 0 ? <p className="text-sm text-muted-foreground">暂无举报记录。</p> : null}
          {reports.slice(0, 5).map((report) => (
            <div key={report.id} className="rounded-md border border-border bg-black/30 p-4 text-sm text-muted-foreground">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <p className="font-medium text-foreground">{report.reason}</p>
                <Badge tone={report.status === "resolved" ? "success" : report.status === "rejected" ? "muted" : "warning"}>
                  {reportStatusText[report.status]}
                </Badge>
              </div>
              <p className="mt-2">类型：{report.type} / 订单：{report.order_id || "无"} / 评价：{report.review_id || "无"}</p>
              <p className="mt-1">处理备注：{report.admin_note || "暂无"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

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

function UserStat({ title, value, text }: { title: string; value: string; text: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.04]">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold text-emerald-200">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
