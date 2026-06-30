"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RiskAlert } from "@/components/site/risk-alert";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Order, OrderStatus, User } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const statusText: Record<OrderStatus, string> = {
  pending_payment: "待支付",
  pending: "待接单",
  accepted: "已接单",
  in_progress: "服务中",
  pending_confirm: "待确认完成",
  completed: "已完成",
  cancelled: "已取消",
  disputed: "申诉中",
};

const timelineItems: Array<{ key: keyof Order; label: string; fallback?: keyof Order }> = [
  { key: "created_at", label: "创建订单" },
  { key: "paid_at", label: "支付确认" },
  { key: "accepted_at", label: "护航师接单" },
  { key: "started_at", label: "服务开始" },
  { key: "completed_at", label: "服务完成" },
  { key: "confirmed_at", label: "玩家确认" },
];

export default function OrderDetailPage() {
  return (
    <RoleGate allowedRoles={["customer", "escort", "admin"]}>
      <OrderDetailContent />
    </RoleGate>
  );
}

function OrderDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  async function loadData() {
    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const [profileResponse, orderResponse] = await Promise.all([
      fetch("/api/auth/profile", { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const profileResult = await profileResponse.json();
    const orderResult = await orderResponse.json();

    if (!profileResponse.ok) {
      setMessage(profileResult.error || "读取用户资料失败。");
      setIsLoading(false);
      return;
    }

    if (!orderResponse.ok) {
      setMessage(orderResult.error || "读取订单失败。");
      setIsLoading(false);
      return;
    }

    setProfile(profileResult.data);
    setOrder(orderResult.data?.[0] || null);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [orderId]);

  async function runAction(action: string) {
    setMessage("");
    setUpdatingAction(action);
    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: orderId, action }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "订单操作失败。");
      }

      setOrder(result.data);
      setMessage("操作成功，订单状态已更新。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "订单操作失败。");
    } finally {
      setUpdatingAction(null);
    }
  }

  const isCustomer = Boolean(profile && order && (order.customer_id === profile.id || order.user_id === profile.id));
  const isEscort = Boolean(profile && order && order.escort_user_id === profile.id);
  const isAdmin = profile?.role === "admin";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <p className="text-sm text-primary">订单详情</p>
        <h1 className="mt-2 text-3xl font-bold">{order?.order_no || order?.id || "正在读取订单"}</h1>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">正在加载订单...</p> : null}
      {message ? <p className="mb-5 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}

      {order ? (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <CardTitle>基础信息</CardTitle>
                <Badge tone={order.status === "completed" ? "success" : order.status === "cancelled" ? "muted" : "warning"}>
                  {statusText[order.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-muted-foreground">
              <div className="grid gap-2 md:grid-cols-2">
                <p>游戏：{order.game_name || "未填写"}</p>
                <p>服务类型：{order.service_type}</p>
                <p>护航师：{order.escorts?.nickname || "平台推荐"}</p>
                <p>金额：{formatMoney(order.price)}</p>
                <p>区服：{order.server_region || "未填写"}</p>
                <p>模式：{order.game_mode || "未填写"}</p>
                <p>开始时间：{order.start_time ? new Date(order.start_time).toLocaleString("zh-CN") : "立即开始"}</p>
                <p>服务时长：{order.duration_hours || 0} 小时</p>
                <p>微信：{order.contact_wechat || "未填写"}</p>
                <p>QQ：{order.contact_qq || "未填写"}</p>
                <p>手机号：{order.contact_phone || "未填写"}</p>
              </div>
              <p>需求说明：{order.requirement || order.remark || "无"}</p>
            </CardContent>
          </Card>

          <div className="grid content-start gap-5">
            <Card>
              <CardHeader>
                <CardTitle>订单操作</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {isCustomer && order.status === "pending_payment" ? (
                  <Button asChild>
                    <Link href={`/orders/pay/${order.id}`}>去支付</Link>
                  </Button>
                ) : null}
                {isCustomer && (order.status === "pending_payment" || order.status === "pending") ? (
                  <Button type="button" variant="outline" disabled={updatingAction === "cancel"} onClick={() => runAction("cancel")}>
                    {updatingAction === "cancel" ? "处理中..." : "取消订单"}
                  </Button>
                ) : null}
                {isCustomer && order.status === "pending_confirm" ? (
                  <Button type="button" disabled={updatingAction === "confirm"} onClick={() => runAction("confirm")}>
                    {updatingAction === "confirm" ? "处理中..." : "确认完成"}
                  </Button>
                ) : null}
                {isCustomer && order.status === "pending_confirm" ? (
                  <Button type="button" variant="outline" disabled={updatingAction === "dispute"} onClick={() => runAction("dispute")}>
                    发起申诉
                  </Button>
                ) : null}
                {isCustomer && order.status === "completed" ? (
                  <Button asChild variant="outline">
                    <Link href={`/reviews/new?orderId=${order.id}`}>去评价</Link>
                  </Button>
                ) : null}
                {(isCustomer || isAdmin) && order.status === "completed" ? (
                  <Button asChild variant="outline">
                    <Link href={`/reports/new?orderId=${order.id}`}>举报订单</Link>
                  </Button>
                ) : null}
                {(isEscort || isAdmin) && order.status === "pending" ? (
                  <Button type="button" disabled={updatingAction === "accept"} onClick={() => runAction("accept")}>
                    接单
                  </Button>
                ) : null}
                {(isEscort || isAdmin) && order.status === "accepted" ? (
                  <Button type="button" disabled={updatingAction === "start"} onClick={() => runAction("start")}>
                    开始服务
                  </Button>
                ) : null}
                {(isEscort || isAdmin) && order.status === "in_progress" ? (
                  <Button type="button" disabled={updatingAction === "finish"} onClick={() => runAction("finish")}>
                    完成服务
                  </Button>
                ) : null}
                {isAdmin && order.status !== "completed" && order.status !== "cancelled" ? (
                  <Button type="button" variant="danger" disabled={updatingAction === "cancel"} onClick={() => runAction("cancel")}>
                    取消异常订单
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href="/chat">联系客服</Link>
                </Button>
              </CardContent>
            </Card>
            <RiskAlert />
            <ContactServiceCard compact />
          </div>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>状态时间线</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {timelineItems.map((item) => {
                const value = order[item.key];
                return (
                  <div key={item.label} className="flex flex-col gap-1 rounded-md border border-white/10 bg-black/25 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>{item.label}</span>
                    <span className={value ? "text-emerald-200" : "text-muted-foreground"}>
                      {typeof value === "string" && value ? new Date(value).toLocaleString("zh-CN") : "未完成"}
                    </span>
                  </div>
                );
              })}
              <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-black/25 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span>评价完成</span>
                <span className="text-muted-foreground">完成订单后可评价</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : !isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">订单不存在，或你没有查看权限。</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
