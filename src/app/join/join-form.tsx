"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAuthSessionState } from "@/lib/auth-client";
import type { EscortApplication, User } from "@/lib/types";

const statusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

function formatTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join("，");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

export function JoinForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [application, setApplication] = useState<EscortApplication | null>(null);
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectedForm, setShowRejectedForm] = useState(false);

  async function loadApplication(token: string) {
    const response = await fetch("/api/join", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const result = (await response.json()) as { data: EscortApplication | null };
    setApplication(result.data);
  }

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const state = await getAuthSessionState();

        if (!state.profile || !state.accessToken) {
          router.replace("/login");
          return;
        }

        if (!cancelled) {
          setProfile(state.profile);
          setAccessToken(state.accessToken);
          await loadApplication(state.accessToken);
        }
      } catch {
        router.replace("/login");
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!accessToken) {
      setMessage("请先登录后再申请成为护航师。");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      nickname: String(formData.get("nickname") || "").trim(),
      game_id: String(formData.get("game_id") || "").trim(),
      contact_wechat: String(formData.get("contact_wechat") || "").trim(),
      contact_qq: String(formData.get("contact_qq") || "").trim(),
      rank: String(formData.get("rank") || "").trim(),
      kd: Number(formData.get("kd")),
      good_at_modes: String(formData.get("good_at_modes") || "").trim(),
      good_at_maps: String(formData.get("good_at_maps") || "").trim(),
      price: Number(formData.get("price")),
      intro: String(formData.get("intro") || "").trim(),
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "提交入驻申请失败。");
      }

      setApplication(result.data);
      router.push("/join/success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交入驻申请失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">正在读取登录状态...</div>;
  }

  if (profile?.role === "escort") {
    return (
      <JoinStatusPanel
        title="你已成为认证护航师。"
        description="当前账号已通过平台审核，可以进入护航师后台管理资料和订单。"
        badgeText="已通过"
        actions={[{ label: "进入护航师后台", href: "/escort/dashboard" }]}
      />
    );
  }

  if (application && application.status === "pending") {
    return (
      <JoinStatusPanel
        title="你已提交申请，正在审核中。"
        description="平台正在审核你的护航师入驻资料，审核结果会同步到个人中心。"
        badgeText="待审核"
        actions={[
          { label: "查看申请状态", href: "/center" },
          { label: "返回个人中心", href: "/center" },
          { label: "联系客服", href: "/chat" },
        ]}
      />
    );
  }

  if (application && application.status === "approved") {
    return (
      <JoinStatusPanel
        title="你已成为认证护航师。"
        description="当前申请已通过平台审核，可以进入护航师后台。"
        badgeText="已通过"
        actions={[{ label: "进入护航师后台", href: "/escort/dashboard" }]}
      />
    );
  }

  if (application && application.status === "rejected" && !showRejectedForm) {
    return (
      <JoinStatusPanel
        title="申请未通过"
        description={application.reject_reason || "当前申请未通过平台审核，请完善资料后重新提交。"}
        badgeText="已拒绝"
        actions={[
          { label: "重新提交申请", onClick: () => setShowRejectedForm(true) },
          { label: "联系客服", href: "/chat" },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-5">
        <p className="text-sm text-primary">护航师入驻</p>
        <h1 className="mt-2 text-3xl font-bold">申请成为三角洲行动护航师</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          提交资料后进入待审核状态。审核通过后，你的账号角色会变为护航师，下次登录后进入护航师后台。
        </p>
      </div>

      {application?.status === "rejected" ? (
        <Card className="mb-5 border-red-400/25 bg-red-400/10">
          <CardContent className="p-5">
            <p className="font-bold">上次申请未通过</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{application.reject_reason || "请完善资料后重新提交。"}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>入驻资料</CardTitle>
          <CardDescription>请填写真实资料，方便管理员审核。微信或 QQ 至少填写一个。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                护航师昵称
                <Input name="nickname" placeholder="例如：夜枭" defaultValue={application?.nickname || ""} />
              </label>
              <label className="grid gap-2 text-sm">
                游戏 ID
                <Input name="game_id" placeholder="填写三角洲行动游戏 ID" defaultValue={application?.game_id || ""} />
              </label>
              <label className="grid gap-2 text-sm">
                微信
                <Input name="contact_wechat" placeholder="微信号" defaultValue={application?.contact_wechat || ""} />
              </label>
              <label className="grid gap-2 text-sm">
                QQ
                <Input name="contact_qq" placeholder="QQ号" defaultValue={application?.contact_qq || ""} />
              </label>
              <label className="grid gap-2 text-sm">
                当前段位
                <Input name="rank" placeholder="例如：烽火地带王牌" defaultValue={application?.rank || ""} />
              </label>
              <label className="grid gap-2 text-sm">
                KD
                <Input name="kd" type="number" min={0} max={20} step={0.1} placeholder="例如：4.8" defaultValue={application?.kd || ""} />
              </label>
              <label className="grid gap-2 text-sm">
                擅长模式
                <Input name="good_at_modes" placeholder="例如：带撤离，物资护送" defaultValue={formatTags(application?.good_at_modes)} />
              </label>
              <label className="grid gap-2 text-sm">
                擅长地图
                <Input name="good_at_maps" placeholder="例如：航天基地，零号大坝" defaultValue={formatTags(application?.good_at_maps)} />
              </label>
              <label className="grid gap-2 text-sm">
                每局价格
                <Input name="price" type="number" min={1} max={9999} placeholder="例如：88" defaultValue={application?.price || ""} />
              </label>
            </div>
            <label className="grid gap-2 text-sm">
              个人简介
              <Textarea
                name="intro"
                placeholder="说明你的在线时间、擅长玩法、沟通方式和服务边界。"
                defaultValue={application?.intro || ""}
                maxLength={500}
              />
            </label>
            {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交申请"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/center">返回个人中心</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

type JoinStatusAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

function JoinStatusPanel({ title, description, badgeText, actions }: { title: string; description: string; badgeText: string; actions: JoinStatusAction[] }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#050907] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.16),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.18),rgba(0,0,0,0.78))]" />
      <Card className="relative mx-auto max-w-3xl border-emerald-300/20 bg-white/[0.04] shadow-[0_0_45px_rgba(16,185,129,0.12)] backdrop-blur-md">
        <CardContent className="p-6 sm:p-8">
          <p className="text-sm font-medium text-emerald-300">护航师入驻</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <Badge tone="warning">{badgeText}</Badge>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {actions.map((action) =>
              action.href ? (
                <Button key={action.label} asChild variant="outline">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button key={action.label} type="button" onClick={action.onClick}>
                  {action.label}
                </Button>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
