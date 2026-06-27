import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RoleGate } from "@/components/site/role-gate";
import { SuccessFeedback } from "@/components/site/success-feedback";

export default function ReviewSuccessPage() {
  return (
    <RoleGate allowedRoles={["customer", "admin"]}>
      <SuccessFeedback
        eyebrow="评价已提交"
        title="感谢你的真实反馈"
        description="评价已进入护航师信誉记录，平台会持续维护订单服务质量。"
        statusItems={[
          { label: "评价状态", value: "已发布" },
          { label: "风控记录", value: "已同步" },
          { label: "售后入口", value: "可联系客服" },
        ]}
        steps={[
          { label: "完成订单", state: "done" },
          { label: "提交评价", state: "done" },
          { label: "信誉同步", state: "current" },
        ]}
        actions={[
          { label: "查看我的订单", href: "/orders" },
          { label: "返回首页", href: "/", variant: "outline" },
          { label: "联系客服", href: "/chat", variant: "outline" },
        ]}
      >
        <ContactServiceCard compact />
      </SuccessFeedback>
    </RoleGate>
  );
}
