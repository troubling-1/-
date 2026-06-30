"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RiskAlert } from "@/components/site/risk-alert";
import { RoleGate } from "@/components/site/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Order } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export default function OrderPayPage() {
  return (
    <RoleGate allowedRoles={["customer", "admin"]}>
      <OrderPayContent />
    </RoleGate>
  );
}

function OrderPayContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  async function loadOrder() {
    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "读取订单失败。");
      setIsLoading(false);
      return;
    }

    setOrder(result.data?.[0] || null);
    setIsLoading(false);
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function confirmPay() {
    setMessage("");
    setIsPaying(true);
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
        body: JSON.stringify({ id: orderId, action: "pay" }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "模拟支付失败。");
      }

      router.push(`/orders/success?id=${orderId}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "模拟支付失败。");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="border-emerald-300/20 bg-white/[0.04]">
        <CardHeader>
          <CardTitle>模拟支付确认</CardTitle>
          <CardDescription>当前不接入真实支付。点击确认后，订单会进入待接单状态。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {isLoading ? <p className="text-sm text-muted-foreground">正在读取订单...</p> : null}
          {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
          {order ? (
            <div className="grid gap-3 rounded-md border border-white/10 bg-black/30 p-4 text-sm">
              <p>订单编号：{order.order_no || order.id}</p>
              <p>游戏：{order.game_name || "未填写"}</p>
              <p>服务：{order.service_type}</p>
              <p>护航师：{order.escorts?.nickname || "平台推荐"}</p>
              <p className="text-2xl font-bold text-emerald-200">应付金额：{formatMoney(order.price)}</p>
              <p>当前状态：{order.status === "pending_payment" ? "待支付" : order.status}</p>
            </div>
          ) : null}
          <RiskAlert />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" disabled={!order || order.status !== "pending_payment" || isPaying} onClick={confirmPay}>
              {isPaying ? "确认中..." : "我已确认支付（模拟支付）"}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/orders/${orderId}`}>查看订单详情</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
