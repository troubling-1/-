"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RiskAlert } from "@/components/site/risk-alert";
import { RoleGate } from "@/components/site/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Order, Wallet } from "@/lib/types";
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
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  async function loadData() {
    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const [orderResponse, walletResponse] = await Promise.all([
      fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    const orderResult = await orderResponse.json();
    const walletResult = await walletResponse.json();

    if (!orderResponse.ok) {
      setMessage(orderResult.error || "读取订单失败。");
      setIsLoading(false);
      return;
    }

    if (!walletResponse.ok) {
      setMessage(walletResult.error || "读取钱包失败。");
      setIsLoading(false);
      return;
    }

    setOrder(orderResult.data?.[0] || null);
    setWallet(walletResult.data || null);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [orderId]);

  async function payWithBalance() {
    setMessage("");
    setIsPaying(true);
    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch("/api/orders/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "余额支付失败。");
      }

      router.push(`/orders/success?id=${orderId}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "余额支付失败。");
      await loadData();
    } finally {
      setIsPaying(false);
    }
  }

  const balance = wallet?.balance || 0;
  const price = order?.price || 0;
  const isPaid = order?.payment_status === "paid" || order?.status !== "pending_payment";
  const insufficient = Boolean(order && wallet && balance < price);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="border-emerald-300/20 bg-white/[0.04]">
        <CardHeader>
          <CardTitle>余额支付</CardTitle>
          <CardDescription>不接入真实微信/支付宝，订单金额会从钱包余额扣除并进入平台托管冻结。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {isLoading ? <p className="text-sm text-muted-foreground">正在读取订单和钱包...</p> : null}
          {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
          {order ? (
            <div className="grid gap-3 rounded-md border border-white/10 bg-black/30 p-4 text-sm">
              <p>订单编号：{order.order_no || order.id}</p>
              <p>游戏：{order.game_name || "未填写"}</p>
              <p>护航师：{order.escorts?.nickname || "平台推荐"}</p>
              <p className="text-2xl font-bold text-emerald-200">订单金额：{formatMoney(order.price)}</p>
              <p>当前状态：{isPaid ? "已支付或不可支付" : "待支付"}</p>
            </div>
          ) : null}
          <div className="grid gap-3 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm">
            <p>当前可用余额</p>
            <p className="text-3xl font-bold text-emerald-100">{formatMoney(balance)}</p>
            {insufficient ? <p className="text-amber-200">余额不足，请先充值后再支付。</p> : null}
          </div>
          <RiskAlert />
          <div className="flex flex-col gap-3 sm:flex-row">
            {insufficient ? (
              <Button asChild>
                <Link href={`/wallet/recharge?returnTo=/orders/pay/${orderId}`}>去充值</Link>
              </Button>
            ) : (
              <Button type="button" disabled={!order || !wallet || isPaid || isPaying} onClick={payWithBalance}>
                {isPaying ? "支付中..." : "余额支付"}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/orders/${orderId}`}>查看订单详情</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/center/wallet">查看钱包</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
