"use client";

import { RoleGate } from "@/components/site/role-gate";
import { SuccessFeedback } from "@/components/site/success-feedback";

export default function JoinSuccessPage() {
  return (
    <RoleGate allowedRoles={["customer", "escort", "admin"]}>
      <SuccessFeedback
        eyebrow="护航师入驻"
        title="申请已提交"
        description="你的护航师入驻申请已进入平台审核流程。"
        statusItems={[
          { label: "当前状态", value: "待审核" },
          { label: "预计审核时间", value: "1-24小时" },
          { label: "审核结果", value: "请在个人中心查看" },
        ]}
        steps={[
          { label: "提交资料", state: "done" },
          { label: "平台审核", state: "current" },
          { label: "通过后开通护航师后台", state: "pending" },
        ]}
        actions={[
          { label: "返回个人中心", href: "/center" },
          { label: "查看申请状态", href: "/center", variant: "outline" },
          { label: "联系客服", href: "/chat", variant: "secondary" },
        ]}
      />
    </RoleGate>
  );
}
