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
import { formatMoney } from "@/lib/utils";

const statusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

export function JoinForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [application, setApplication] = useState<EscortApplication | null>(null);
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setMessage("入驻申请已提交，请等待管理员审核。");
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
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold">你已经是护航师</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">当前账号已通过护航师审核，可以进入护航师后台管理资料和订单。</p>
            <Button asChild className="mt-6">
              <Link href="/escort/dashboard">进入护航师后台</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
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

      {application ? (
        <Card className="mb-5">
          <CardContent className="p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold">当前申请状态</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {application.nickname} / {application.rank} / {formatMoney(application.price)}/局
                </p>
                {application.status === "rejected" && application.reject_reason ? (
                  <p className="mt-2 text-sm text-destructive">拒绝原因：{application.reject_reason}</p>
                ) : null}
              </div>
              <Badge tone={application.status === "approved" ? "success" : application.status === "pending" ? "warning" : "muted"}>
                {statusText[application.status]}
              </Badge>
            </div>
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
                <Input name="good_at_modes" placeholder="例如：带撤离，物资护送" defaultValue={application?.good_at_modes.join("，") || ""} />
              </label>
              <label className="grid gap-2 text-sm">
                擅长地图
                <Input name="good_at_maps" placeholder="例如：航天基地，零号大坝" defaultValue={application?.good_at_maps.join("，") || ""} />
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
