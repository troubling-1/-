"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleGate } from "@/components/site/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Wallet, WithdrawMethod } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export default function EscortWithdrawPage() {
  return (
    <RoleGate allowedRoles={["escort"]}>
      <EscortWithdrawContent />
    </RoleGate>
  );
}

function EscortWithdrawContent() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [method, setMethod] = useState<WithdrawMethod>("wechat");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadWallet() {
    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch("/api/wallet", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (response.ok) {
      setWallet(result.data);
    } else {
      setMessage(result.error || "读取钱包失败。");
    }
  }

  useEffect(() => {
    loadWallet();
  }, []);

  async function submitWithdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      amount: Number(formData.get("amount")),
      method,
      account_name: String(formData.get("account_name") || "").trim(),
      account_no: String(formData.get("account_no") || "").trim(),
      note: String(formData.get("note") || "").trim(),
    };

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      setMessage("提现金额必须大于 0。");
      return;
    }

    if (wallet && payload.amount > wallet.balance) {
      setMessage("提现金额不能超过可用余额。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/withdraws", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "提交提现失败。");
      }

      router.push("/escort/withdraw/success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交提现失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="border-emerald-300/20 bg-white/[0.04]">
        <CardHeader>
          <CardTitle>申请提现</CardTitle>
          <CardDescription>提交后余额进入提现中，管理员审核并确认打款。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-sm text-muted-foreground">可提现余额</p>
            <p className="mt-2 text-3xl font-bold text-emerald-100">{formatMoney(wallet?.balance || 0)}</p>
          </div>
          {message ? <p className="mb-4 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
          <form className="grid gap-4" onSubmit={submitWithdraw}>
            <label className="grid gap-2 text-sm">
              提现金额
              <Input name="amount" type="number" min="1" step="1" placeholder="输入提现金额" />
            </label>
            <label className="grid gap-2 text-sm">
              提现方式
              <Select value={method} onChange={(event) => setMethod(event.target.value as WithdrawMethod)}>
                <option value="wechat">微信</option>
                <option value="alipay">支付宝</option>
                <option value="bank">银行卡</option>
              </Select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                收款姓名
                <Input name="account_name" placeholder="真实姓名或收款姓名" />
              </label>
              <label className="grid gap-2 text-sm">
                收款账号
                <Input name="account_no" placeholder="微信号 / 支付宝 / 银行卡号" />
              </label>
            </div>
            <label className="grid gap-2 text-sm">
              备注
              <Textarea name="note" maxLength={300} placeholder="可填写补充说明" />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交提现申请"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/escort/wallet">返回钱包</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
