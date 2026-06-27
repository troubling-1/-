"use client";

import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RoleGate } from "@/components/site/role-gate";
import { SuccessFeedback } from "@/components/site/success-feedback";

export default function OrderSuccessPage() {
  return (
    <RoleGate allowedRoles={["customer", "admin"]}>
      <SuccessFeedback
        eyebrow="订单已创建"
        title="订单提交成功"
        description="护航师或客服将尽快联系你，请保持联系方式畅通。"
        statusItems={[
          { label: "订单状态", value: "待接单" },
          { label: "下一步", value: "护航师确认" },
          { label: "联系提醒", value: "请留意微信或 QQ" },
        ]}
        actions={[
          { label: "查看我的订单", href: "/orders" },
          { label: "返回首页", href: "/", variant: "outline" },
          { label: "联系客服", href: "/chat", variant: "secondary" },
        ]}
      >
        <ContactServiceCard compact />
      </SuccessFeedback>
    </RoleGate>
  );
}
