"use client";

import { RoleGate } from "@/components/site/role-gate";
import { SuccessFeedback } from "@/components/site/success-feedback";

export default function EscortWithdrawSuccessPage() {
  return (
    <RoleGate allowedRoles={["escort"]}>
      <SuccessFeedback
        eyebrow="提现申请已提交"
        title="等待管理员审核"
        description="提现金额已进入提现中，审核通过并确认打款后会计入已提现金额。"
        statusItems={[
          { label: "当前状态", value: "待审核" },
          { label: "下一步", value: "管理员处理" },
          { label: "资金状态", value: "提现中" },
        ]}
        actions={[
          { label: "返回护航师钱包", href: "/escort/wallet" },
          { label: "返回护航师后台", href: "/escort/dashboard", variant: "outline" },
        ]}
      />
    </RoleGate>
  );
}
