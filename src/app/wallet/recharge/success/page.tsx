"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RoleGate } from "@/components/site/role-gate";
import { SuccessFeedback } from "@/components/site/success-feedback";
import { formatMoney } from "@/lib/utils";

export default function RechargeSuccessPage() {
  return (
    <RoleGate allowedRoles={["customer", "escort", "admin"]}>
      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载充值结果...</div>}>
        <RechargeSuccessContent />
      </Suspense>
    </RoleGate>
  );
}

function RechargeSuccessContent() {
  const searchParams = useSearchParams();
  const balance = Number(searchParams.get("balance")) || 0;
  const returnTo = searchParams.get("returnTo") || "/orders/new";

  return (
    <SuccessFeedback
      eyebrow="充值成功"
      title="模拟充值已完成"
      description="余额已写入钱包，流水记录已同步到 Supabase。"
      statusItems={[
        { label: "当前余额", value: formatMoney(balance) },
        { label: "充值方式", value: "模拟充值" },
        { label: "资金状态", value: "可用余额" },
      ]}
      actions={[
        { label: "返回钱包", href: "/center/wallet" },
        { label: "立即下单", href: returnTo, variant: "outline" },
      ]}
    />
  );
}
