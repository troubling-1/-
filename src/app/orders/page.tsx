"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RiskAlert } from "@/components/site/risk-alert";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Order, OrderStatus, Review } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const statusText: Record<OrderStatus, string> = {
  pending: "待接单",
  accepted: "已接单",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
};

function getStatusTone(status: OrderStatus) {
  if (status === "completed") return "success";
  if (status === "accepted" || status === "in_progress") return "warning";
  if (status === "cancelled") return "muted";
  return "default";
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  async function loadOrders() {
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录后查看订单。");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/orders", {
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

    const nextOrders = (result.data || []) as Order[];
    setOrders(nextOrders);
    await loadReviewedOrders(nextOrders, token);
    setIsLoading(false);
  }

  async function loadReviewedOrders(nextOrders: Order[], token: string) {
    const completedOrders = nextOrders.filter((order) => order.status === "completed");
    const reviewedIds: string[] = [];

    await Promise.all(
      completedOrders.map(async (order) => {
        const response = await fetch(`/api/reviews?orderId=${encodeURIComponent(order.id)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as { data?: Review[] };

        if (result.data?.length) {
          reviewedIds.push(order.id);
        }
      }),
    );

    setReviewedOrderIds(reviewedIds);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function cancelOrder(orderId: string) {
    setMessage("");
    setUpdatingOrderId(orderId);
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录后再取消订单。");
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
        body: JSON.stringify({ id: orderId, status: "cancelled" }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "取消订单失败。");
      }

      setMessage("订单已取消。");
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "取消订单失败。");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-3xl font-bold">订单中心</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">查看你的护航订单状态、联系方式和售后操作。</p>

      <div className="mt-5">
        <RiskAlert />
      </div>

      {message ? <p className="mt-4 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}

      <div className="mt-6 grid gap-4">
        {isLoading ? <p className="text-sm text-muted-foreground">正在加载订单...</p> : null}
        {!isLoading && orders.length === 0 ? <p className="rounded-md border border-border bg-black/30 p-4 text-sm text-muted-foreground">暂无订单。</p> : null}

        {orders.map((order) => {
          const reviewed = reviewedOrderIds.includes(order.id);

          return (
            <Card key={order.id} className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <CardTitle>{order.escorts?.nickname || "护航师"}</CardTitle>
                  <Badge tone={getStatusTone(order.status)}>{statusText[order.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-muted-foreground">
                <div className="grid gap-2 md:grid-cols-3">
                  <p>订单编号：{order.id}</p>
                  <p>服务类型：{order.service_type}</p>
                  <p>价格：{formatMoney(order.price)}</p>
                  <p>游戏模式：{order.game_mode || "未填写"}</p>
                  <p>微信：{order.contact_wechat || "未填写"}</p>
                  <p>QQ：{order.contact_qq || "未填写"}</p>
                  <p>创建时间：{new Date(order.created_at).toLocaleString("zh-CN")}</p>
                </div>
                <p>需求说明：{order.requirement || order.remark || "无"}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {order.status === "pending" ? (
                    <Button type="button" variant="outline" disabled={updatingOrderId === order.id} onClick={() => cancelOrder(order.id)}>
                      {updatingOrderId === order.id ? "取消中..." : "取消订单"}
                    </Button>
                  ) : null}
                  {order.status === "accepted" || order.status === "in_progress" ? (
                    <Button asChild variant="outline">
                      <Link href="/chat">查看详情</Link>
                    </Button>
                  ) : null}
                  {order.status === "completed" && !reviewed ? (
                    <Button asChild variant="outline">
                      <Link href={`/reviews/new?orderId=${order.id}`}>去评价</Link>
                    </Button>
                  ) : null}
                  {order.status === "completed" && reviewed ? (
                    <Button type="button" variant="outline" disabled>
                      已评价
                    </Button>
                  ) : null}
                  <Button asChild variant="outline">
                    <Link href={`/reports/new?orderId=${order.id}`}>举报 / 申诉</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/chat">联系客服</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RoleGate allowedRoles={["customer", "escort", "admin"]}>
      <OrdersContent />
    </RoleGate>
  );
}
