"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleGate } from "@/components/site/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentAccessToken } from "@/lib/auth-client";
import { formatMoney } from "@/lib/utils";

const amountOptions = [10, 30, 50, 100, 200];

export default function RechargePage() {
  return (
    <RoleGate allowedRoles={["customer", "escort", "admin"]}>
      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载充值页面...</div>}>
        <RechargeContent />
      </Suspense>
    </RoleGate>
  );
}

function RechargeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/orders/new";
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const finalAmount = customAmount ? Number(customAmount) : amount;

  async function submitRecharge() {
    setMessage("");
    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      setMessage("充值金额必须大于 0。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: finalAmount }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "模拟充值失败。");
      }

      router.push(`/wallet/recharge/success?balance=${encodeURIComponent(result.data.balance)}&returnTo=${encodeURIComponent(returnTo)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "模拟充值失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="border-emerald-300/20 bg-white/[0.04]">
        <CardHeader>
          <CardTitle>模拟充值</CardTitle>
          <CardDescription>当前不接入真实支付，确认后直接写入 Supabase 钱包和流水。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {amountOptions.map((value) => (
              <Button
                key={value}
                type="button"
                variant={!customAmount && amount === value ? "default" : "outline"}
                onClick={() => {
                  setAmount(value);
                  setCustomAmount("");
                }}
              >
                {formatMoney(value)}
              </Button>
            ))}
          </div>
          <label className="grid gap-2 text-sm">
            自定义金额
            <Input
              type="number"
              min="1"
              max="10000"
              step="1"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              placeholder="输入充值金额"
            />
          </label>
          <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-sm text-muted-foreground">本次模拟充值</p>
            <p className="mt-2 text-3xl font-bold text-emerald-100">{formatMoney(finalAmount || 0)}</p>
          </div>
          {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" disabled={isSubmitting} onClick={submitRecharge}>
              {isSubmitting ? "充值中..." : "确认模拟充值"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/center/wallet">返回钱包</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
