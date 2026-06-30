"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Order, OrderStatus } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const statusText: Record<OrderStatus, string> = {
  pending_payment: "待支付",
  pending: "待接单",
  accepted: "已接单",
  in_progress: "服务中",
  pending_confirm: "待确认",
  completed: "已完成",
  cancelled: "已取消",
  disputed: "申诉中",
};

const nextAction: Partial<Record<OrderStatus, { action: string; label: string; success: string }>> = {
  pending: { action: "accept", label: "接单", success: "接单成功，订单已进入已接单状态。" },
  accepted: { action: "start", label: "开始服务", success: "服务已开始。" },
  in_progress: { action: "finish", label: "完成服务", success: "服务已提交完成，等待玩家确认。" },
};

export default function EscortDashboardPage() {
  return (
    <RoleGate allowedRoles={["escort"]}>
      <EscortDashboardContent />
    </RoleGate>
  );
}

function EscortDashboardContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  async function loadOrders() {
    setIsLoading(true);
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录护航师账号。");
      setIsLoading(false);
      return;
    }

    const profileResponse = await fetch("/api/escort/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profileResult = await profileResponse.json();

    if (!profileResponse.ok) {
      setProfileError(profileResult.error || "护航师资料未开通或已被禁用。");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/orders?scope=escort", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "读取订单失败。");
      setIsLoading(false);
      return;
    }

    setOrders(result.data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const todayText = new Date().toLocaleDateString("zh-CN");
  const todayOrders = useMemo(() => orders.filter((order) => new Date(order.created_at).toLocaleDateString("zh-CN") === todayText), [orders, todayText]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "pending"), [orders]);
  const acceptedOrders = useMemo(() => orders.filter((order) => order.status === "accepted"), [orders]);
  const inProgressOrders = useMemo(() => orders.filter((order) => order.status === "in_progress"), [orders]);
  const pendingConfirmOrders = useMemo(() => orders.filter((order) => order.status === "pending_confirm"), [orders]);
  const completedOrders = useMemo(() => orders.filter((order) => order.status === "completed"), [orders]);
  const activeOrders = acceptedOrders.length + inProgressOrders.length + pendingConfirmOrders.length;
  const estimatedIncome = orders
    .filter((order) => order.status !== "cancelled" && order.status !== "pending_payment")
    .reduce((sum, order) => sum + (Number(order.escort_income) || order.price), 0);
  const historyIncome = completedOrders.reduce((sum, order) => sum + (Number(order.escort_income) || order.price), 0);

  async function updateOrderStatus(order: Order, action: string) {
    setMessage("");
    setUpdatingOrderId(order.id);
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录护航师账号。");
      setUpdatingOrderId(null);
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: order.id, action }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "更新订单失败。");
      }

      setMessage(nextAction[order.status]?.success || "订单状态已更新。");
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新订单失败。");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (profileError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="border-amber-300/20 bg-amber-300/10">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold">护航师资料未开通或已被禁用</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{profileError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">护航师后台</h1>
      <p className="mt-2 text-sm text-muted-foreground">只展示分配给你的订单，按流程接单、开始服务和提交完成。</p>

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <StatCard title="今日订单" value={`${todayOrders.length}`} />
        <StatCard title="进行中订单" value={`${activeOrders}`} />
        <StatCard title="已完成订单" value={`${completedOrders.length}`} />
        <StatCard title="预计收入" value={formatMoney(estimatedIncome)} />
        <StatCard title="历史收入" value={formatMoney(historyIncome)} />
      </div>

      {message ? <p className="mt-6 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{message}</p> : null}
      {isLoading ? <p className="mt-6 text-sm text-muted-foreground">正在加载订单...</p> : null}

      <OrderSection title="待接单" orders={pendingOrders} updatingOrderId={updatingOrderId} onUpdate={updateOrderStatus} />
      <OrderSection title="已接单" orders={acceptedOrders} updatingOrderId={updatingOrderId} onUpdate={updateOrderStatus} />
      <OrderSection title="服务中" orders={inProgressOrders} updatingOrderId={updatingOrderId} onUpdate={updateOrderStatus} />
      <OrderSection title="待确认" orders={pendingConfirmOrders} updatingOrderId={updatingOrderId} onUpdate={updateOrderStatus} />
      <OrderSection title="已完成" orders={completedOrders} updatingOrderId={updatingOrderId} onUpdate={updateOrderStatus} />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

function OrderSection({
  title,
  orders,
  updatingOrderId,
  onUpdate,
}: {
  title: string;
  orders: Order[];
  updatingOrderId: string | null;
  onUpdate: (order: Order, action: string) => void;
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {orders.length === 0 ? <p className="text-sm text-muted-foreground">暂无订单。</p> : null}
        {orders.map((order) => {
          const action = nextAction[order.status];
          return (
            <div key={order.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{order.order_no || order.id}</p>
                  <Badge tone={order.status === "completed" ? "success" : "warning"}>{statusText[order.status]}</Badge>
                </div>
                <p>游戏：{order.game_name || "未填写"} / 服务：{order.service_type}</p>
                <p>模式：{order.game_mode || "未填写"} / 区服：{order.server_region || "未填写"}</p>
                <p>需求：{order.requirement || order.remark || "无"}</p>
                <p>联系方式：微信 {order.contact_wechat || "未填写"} / QQ {order.contact_qq || "未填写"} / 手机 {order.contact_phone || "未填写"}</p>
                <p>收入：{formatMoney(Number(order.escort_income) || order.price)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link href={`/orders/${order.id}`}>查看详情</Link>
                </Button>
                {action ? (
                  <Button type="button" disabled={updatingOrderId === order.id} onClick={() => onUpdate(order, action.action)}>
                    {updatingOrderId === order.id ? "处理中..." : action.label}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
