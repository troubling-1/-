import { redirect } from "next/navigation";
import { SuccessFeedback } from "@/components/site/success-feedback";
import { createServerSupabaseUserClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

type ReviewSuccessPageProps = {
  searchParams: Promise<{
    type?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ReviewSuccessPage({ searchParams }: ReviewSuccessPageProps) {
  const supabase = await createServerSupabaseUserClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const serviceSupabase = createServiceSupabaseClient();

  if (!serviceSupabase) {
    redirect("/403");
  }

  const { data: profile } = await serviceSupabase.from("users").select("role,status").eq("id", user.id).maybeSingle();

  if (!profile || profile.status !== "active" || profile.role !== "admin") {
    redirect("/403");
  }

  const params = await searchParams;
  const isRejected = params.type === "rejected";

  return (
    <SuccessFeedback
      eyebrow="管理员审核"
      title={isRejected ? "审核已拒绝" : "审核已通过"}
      description={isRejected ? "拒绝原因已保存，用户可在个人中心查看结果。" : "该用户已升级为护航师身份，并已开通护航师后台。"}
      tone={isRejected ? "danger" : "success"}
      statusItems={
        isRejected
          ? [
              { label: "处理结果", value: "已拒绝" },
              { label: "用户通知", value: "个人中心可查看" },
              { label: "资料状态", value: "已保存" },
            ]
          : [
              { label: "处理结果", value: "已通过" },
              { label: "用户身份", value: "escort" },
              { label: "资料状态", value: "已同步" },
            ]
      }
      actions={
        isRejected
          ? [
              { label: "返回审核列表", href: "/admin" },
              { label: "继续审核下一位", href: "/admin", variant: "outline" },
            ]
          : [
              { label: "返回审核列表", href: "/admin" },
              { label: "查看护航师列表", href: "/escorts", variant: "outline" },
              { label: "继续审核下一位", href: "/admin", variant: "secondary" },
            ]
      }
    />
  );
}
