"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RoleGate } from "@/components/site/role-gate";
import { SuccessFeedback } from "@/components/site/success-feedback";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") || "";

  return (
    <SuccessFeedback
      eyebrow="订单已提交"
      title="订单提交成功"
      description="当前状态：待接单。客服或护航师会尽快联系你，请保持联系方式畅通。"
      statusItems={[
        { label: "当前状态", value: "待接单" },
        { label: "下一步", value: "护航师接单" },
        { label: "风控提醒", value: "只处理站内订单" },
      ]}
      actions={[
        { label: "查看订单", href: orderId ? `/orders/${orderId}` : "/orders" },
        { label: "返回首页", href: "/", variant: "outline" },
        { label: "联系客服", href: "/chat", variant: "secondary" },
      ]}
    >
      <ContactServiceCard compact />
    </SuccessFeedback>
  );
}

export default function OrderSuccessPage() {
  return (
    <RoleGate allowedRoles={["customer", "admin"]}>
      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载订单结果...</div>}>
        <OrderSuccessContent />
      </Suspense>
    </RoleGate>
  );
}
