"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getLocalEscortApplications,
  updateLocalEscortApplicationStatus,
  type EscortApplication,
} from "@/lib/local-escort-applications";
import { getLocalOrders, updateLocalOrderStatus } from "@/lib/local-orders";
import { getLocalReports, updateLocalReportStatus, type Report, type ReportStatus } from "@/lib/local-reports";
import { escorts, services } from "@/lib/mock-data";
import type { Order, OrderStatus, WithdrawStatus } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

type AdminWithdraw = {
  id: string;
  escortName: string;
  amount: number;
  status: WithdrawStatus;
};

const withdrawStorageKey = "delta_escort_admin_withdraws";

const statusText: Record<OrderStatus, string> = {
  pending: "待接单",
  accepted: "已接单",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
};

const applicationStatusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

const withdrawStatusText: Record<WithdrawStatus, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
  paid: "已打款",
};

const reportStatusText: Record<ReportStatus, string> = {
  pending: "待处理",
  resolved: "已处理",
  rejected: "已驳回",
};

const defaultWithdraws: AdminWithdraw[] = [
  { id: "withdraw-001", escortName: "夜枭", amount: 300, status: "pending" },
  { id: "withdraw-002", escortName: "灰烬", amount: 128, status: "approved" },
];

function readJsonList<T>(key: string, fallback: T[]) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function saveJsonList<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getStatusTone(status: OrderStatus | WithdrawStatus | EscortApplication["status"] | ReportStatus) {
  if (status === "completed" || status === "approved" || status === "paid" || status === "resolved") {
    return "success";
  }

  if (status === "accepted" || status === "in_progress" || status === "pending") {
    return "warning";
  }

  return "muted";
}

export default function AdminPage() {
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [applications, setApplications] = useState<EscortApplication[]>([]);
  const [withdraws, setWithdraws] = useState<AdminWithdraw[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  function syncOrders() {
    setOrderList(getLocalOrders());
  }

  function syncApplications() {
    setApplications(getLocalEscortApplications());
  }

  function syncReports() {
    setReports(getLocalReports());
  }

  useEffect(() => {
    setWithdraws(readJsonList(withdrawStorageKey, defaultWithdraws));
    syncOrders();
    syncApplications();
    syncReports();

    window.addEventListener("delta-escort-orders-change", syncOrders);
    window.addEventListener("delta-escort-applications-change", syncApplications);
    window.addEventListener("delta-escort-reports-change", syncReports);
    window.addEventListener("storage", syncOrders);
    window.addEventListener("storage", syncApplications);
    window.addEventListener("storage", syncReports);

    return () => {
      window.removeEventListener("delta-escort-orders-change", syncOrders);
      window.removeEventListener("delta-escort-applications-change", syncApplications);
      window.removeEventListener("delta-escort-reports-change", syncReports);
      window.removeEventListener("storage", syncOrders);
      window.removeEventListener("storage", syncApplications);
      window.removeEventListener("storage", syncReports);
    };
  }, []);

  const statistics = useMemo(() => {
    const orderAmount = orderList.reduce((sum, order) => sum + order.price, 0);
    const pendingOrders = orderList.filter((order) => order.status === "pending").length;
    const pendingApplications = applications.filter((application) => application.status === "pending").length;
    const pendingWithdraws = withdraws.filter((withdraw) => withdraw.status === "pending").length;
    const pendingReports = reports.filter((report) => report.status === "pending").length;

    return {
      userCount: 128,
      escortCount: escorts.length + applications.filter((application) => application.status === "approved").length,
      orderCount: orderList.length,
      orderAmount,
      pendingOrders,
      pendingApplications,
      pendingWithdraws,
      pendingReports,
    };
  }, [applications, orderList, reports, withdraws]);

  function handleApplicationStatus(applicationId: string, status: EscortApplication["status"]) {
    updateLocalEscortApplicationStatus(applicationId, status);
    syncApplications();
  }

  function handleOrderStatus(orderId: string, status: OrderStatus) {
    updateLocalOrderStatus(orderId, status);
    syncOrders();
  }

  function handleWithdrawStatus(withdrawId: string, status: WithdrawStatus) {
    const nextWithdraws = withdraws.map((withdraw) => (withdraw.id === withdrawId ? { ...withdraw, status } : withdraw));
    setWithdraws(nextWithdraws);
    saveJsonList(withdrawStorageKey, nextWithdraws);
  }

  function handleReportStatus(reportId: string, status: ReportStatus) {
    updateLocalReportStatus(reportId, status);
    syncReports();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">管理后台</h1>
        <p className="mt-2 text-sm text-muted-foreground">审核护航师、管理订单、处理提现、查看举报和平台统计。</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>用户数</CardTitle>
            <CardDescription>模拟注册用户</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statistics.userCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>待处理</CardTitle>
            <CardDescription>{statistics.pendingReports} 个举报待处理</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statistics.pendingApplications + statistics.pendingReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>订单数</CardTitle>
            <CardDescription>{statistics.pendingOrders} 个待接单</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statistics.orderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>成交额</CardTitle>
            <CardDescription>{statistics.pendingWithdraws} 个提现待审核</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatMoney(statistics.orderAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>举报管理</CardTitle>
          <CardDescription>处理用户提交的订单和护航师举报。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {reports.length === 0 ? <p className="rounded-md border border-border bg-black/30 p-4 text-sm text-muted-foreground">暂无举报记录。</p> : null}
          {reports.map((report) => (
            <div key={report.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{report.target_type === "escort" ? "护航师举报" : "订单举报"}</p>
                  <Badge tone={getStatusTone(report.status)}>{reportStatusText[report.status]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">对象：{report.target_id}</p>
                <p className="mt-1 text-sm text-muted-foreground">原因：{report.reason}</p>
                <p className="mt-1 text-sm text-muted-foreground">说明：{report.detail}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => handleReportStatus(report.id, "resolved")}>
                  标记已处理
                </Button>
                <Button type="button" size="sm" variant="danger" onClick={() => handleReportStatus(report.id, "rejected")}>
                  驳回
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>护航师入驻审核</CardTitle>
          <CardDescription>审核用户提交的护航师入驻资料。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {applications.length === 0 ? <p className="rounded-md border border-border bg-black/30 p-4 text-sm text-muted-foreground">暂无入驻申请。</p> : null}
          {applications.map((application) => (
            <div key={application.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{application.nickname}</p>
                  <Badge tone={getStatusTone(application.status)}>{applicationStatusText[application.status]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  段位：{application.rank} / KD：{application.kd} / 价格：{formatMoney(application.price)}/局
                </p>
                <p className="mt-1 text-sm text-muted-foreground">联系方式：{application.contact}</p>
                <p className="mt-1 text-sm text-muted-foreground">简介：{application.bio}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => handleApplicationStatus(application.id, "approved")}>
                  通过
                </Button>
                <Button type="button" size="sm" variant="danger" onClick={() => handleApplicationStatus(application.id, "rejected")}>
                  驳回
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>提现管理</CardTitle>
            <CardDescription>处理护航师提现申请。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {withdraws.map((withdraw) => (
              <div key={withdraw.id} className="flex flex-col justify-between gap-3 rounded-md border border-border bg-black/30 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium">{withdraw.escortName}</p>
                  <p className="text-sm text-muted-foreground">申请提现 {formatMoney(withdraw.amount)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={getStatusTone(withdraw.status)}>{withdrawStatusText[withdraw.status]}</Badge>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleWithdrawStatus(withdraw.id, "approved")}>
                    通过
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleWithdrawStatus(withdraw.id, "paid")}>
                    打款
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => handleWithdrawStatus(withdraw.id, "rejected")}>
                    拒绝
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>订单管理</CardTitle>
            <CardDescription>管理员可以处理异常订单。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {orderList.slice(0, 4).map((order) => {
              const service = services.find((item) => item.value === order.service_type);

              return (
                <div key={order.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{service?.label || "未知服务"}</p>
                      <Badge tone={getStatusTone(order.status)}>{statusText[order.status]}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {order.id} / {formatMoney(order.price)} / {order.remark || "无备注"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => handleOrderStatus(order.id, "accepted")}>
                      接单
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleOrderStatus(order.id, "in_progress")}>
                      开始
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleOrderStatus(order.id, "completed")}>
                      完成
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => handleOrderStatus(order.id, "cancelled")}>
                      取消
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
