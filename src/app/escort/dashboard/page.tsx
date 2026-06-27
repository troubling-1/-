"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Order, OrderStatus } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const statusText: Record<OrderStatus, string> = {
  pending: "待接单",
  accepted: "已接单",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
};

const nextAction: Partial<Record<OrderStatus, { status: OrderStatus; label: string; success: string }>> = {
  pending: { status: "accepted", label: "接单", success: "接单成功，订单已进入待服务状态。" },
  accepted: { status: "in_progress", label: "开始服务", success: "服务已开始。" },
  in_progress: { status: "completed", label: "完成订单", success: "订单已完成。" },
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
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  async function loadOrders() {
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录护航师账号。");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/orders?scope=escort", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "pending"), [orders]);
  const activeOrders = useMemo(() => orders.filter((order) => order.status === "accepted" || order.status === "in_progress"), [orders]);
  const completedOrders = useMemo(() => orders.filter((order) => order.status === "completed"), [orders]);
  const totalIncome = completedOrders.reduce((sum, order) => sum + order.price, 0);

  async function updateOrderStatus(order: Order, status: OrderStatus) {
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
        body: JSON.stringify({ id: order.id, status }),
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">护航师后台</h1>
      <p className="mt-2 text-sm text-muted-foreground">查看分配给你的订单，并按流程接单、开始服务、完成订单。</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard title="待接单" value={pendingOrders.length} />
        <StatCard title="进行中" value={activeOrders.length} />
        <StatCard title="已完成收入" value={formatMoney(totalIncome)} />
      </div>

      {message ? <p className="mt-6 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{message}</p> : null}
      {isLoading ? <p className="mt-6 text-sm text-muted-foreground">正在加载订单...</p> : null}

      <OrderSection title="待接单" orders={pendingOrders} updatingOrderId={updatingOrderId} onUpdate={updateOrderStatus} />
      <OrderSection title="进行中" orders={activeOrders} updatingOrderId={updatingOrderId} onUpdate={updateOrderStatus} />
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

function OrderSection({ title, orders, updatingOrderId, onUpdate }: { title: string; orders: Order[]; updatingOrderId: string | null; onUpdate: (order: Order, status: OrderStatus) => void }) {
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
                  <p className="font-medium text-foreground">{order.id}</p>
                  <Badge tone={order.status === "completed" ? "success" : "warning"}>{statusText[order.status]}</Badge>
                </div>
                <p>服务类型：{order.service_type} / 游戏模式：{order.game_mode || "未填写"}</p>
                <p>需求：{order.requirement || order.remark || "无"}</p>
                <p>联系方式：微信 {order.contact_wechat || "未填写"} / QQ {order.contact_qq || "未填写"}</p>
                <p>价格：{formatMoney(order.price)}</p>
              </div>
              {action ? (
                <Button type="button" disabled={updatingOrderId === order.id} onClick={() => onUpdate(order, action.status)}>
                  {updatingOrderId === order.id ? "处理中..." : action.label}
                </Button>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
