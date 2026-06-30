"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Wallet, WalletTransaction } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export default function EscortWalletPage() {
  return (
    <RoleGate allowedRoles={["escort"]}>
      <EscortWalletContent />
    </RoleGate>
  );
}

function EscortWalletContent() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录护航师账号。");
      setIsLoading(false);
      return;
    }

    const [walletResponse, transactionsResponse] = await Promise.all([
      fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/wallet/transactions?limit=12", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const walletResult = await walletResponse.json();
    const transactionsResult = await transactionsResponse.json();

    if (!walletResponse.ok) {
      setMessage(walletResult.error || "读取钱包失败。");
    } else {
      setWallet(walletResult.data);
    }

    if (transactionsResponse.ok) {
      setTransactions(transactionsResult.data || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-primary">护航师资金</p>
          <h1 className="mt-2 text-3xl font-bold">护航师钱包</h1>
          <p className="mt-2 text-sm text-muted-foreground">查看订单收入、提现中金额和已提现记录。</p>
        </div>
        <Button asChild>
          <Link href="/escort/withdraw">申请提现</Link>
        </Button>
      </div>

      {message ? <p className="mt-5 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
      {isLoading ? <p className="mt-5 text-sm text-muted-foreground">正在加载钱包...</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <StatCard title="可用余额" value={formatMoney(wallet?.balance || 0)} />
        <StatCard title="累计收入" value={formatMoney(wallet?.total_income || 0)} />
        <StatCard title="可提现余额" value={formatMoney(wallet?.balance || 0)} />
        <StatCard title="提现中" value={formatMoney(wallet?.pending_withdraw || 0)} />
        <StatCard title="已提现" value={formatMoney(wallet?.total_withdrawn || 0)} />
      </div>

      <Card className="mt-6 border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle>最近流水</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {transactions.length === 0 ? <p className="text-sm text-muted-foreground">暂无流水。</p> : null}
          {transactions.map((item) => (
            <div key={item.id} className="grid gap-2 rounded-md border border-white/10 bg-black/30 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.description || item.type}</p>
                  <Badge tone={item.status === "success" ? "success" : item.status === "pending" ? "warning" : "muted"}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("zh-CN")}</p>
              </div>
              <p className="text-lg font-bold text-emerald-200">{formatMoney(item.amount)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-emerald-300/20 bg-white/[0.04]">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-emerald-200">{value}</p>
      </CardContent>
    </Card>
  );
}
