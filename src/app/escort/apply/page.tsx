"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getLocalCurrentUser } from "@/lib/local-auth";
import {
  createLocalEscortApplication,
  getLocalEscortApplicationByUserId,
  type EscortApplication,
} from "@/lib/local-escort-applications";

const statusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

export default function EscortApplyPage() {
  const [application, setApplication] = useState<EscortApplication | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = getLocalCurrentUser();
    if (!currentUser) {
      return;
    }

    setApplication(getLocalEscortApplicationByUserId(currentUser.id));
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const currentUser = getLocalCurrentUser();
    if (!currentUser) {
      setMessage("请先注册或登录后再申请入驻");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const nickname = String(formData.get("nickname") || "").trim();
    const rank = String(formData.get("rank") || "").trim();
    const kd = Number(formData.get("kd"));
    const price = Number(formData.get("price"));
    const contact = String(formData.get("contact") || "").trim();
    const bio = String(formData.get("bio") || "").trim();

    if (!nickname || nickname.length > 30) {
      setMessage("护航师昵称不能为空，且不能超过 30 个字");
      return;
    }

    if (!rank) {
      setMessage("请填写当前段位");
      return;
    }

    if (!Number.isFinite(kd) || kd < 0 || kd > 20) {
      setMessage("KD 需要填写 0 到 20 之间的数字");
      return;
    }

    if (!Number.isFinite(price) || price < 1 || price > 9999) {
      setMessage("每局价格需要填写 1 到 9999 之间的数字");
      return;
    }

    if (!contact) {
      setMessage("请填写联系方式，方便管理员审核");
      return;
    }

    if (bio.length < 10 || bio.length > 500) {
      setMessage("个人简介需要填写 10 到 500 个字");
      return;
    }

    setIsSubmitting(true);

    try {
      const nextApplication = createLocalEscortApplication({
        user_id: currentUser.id,
        nickname,
        rank,
        kd,
        price,
        bio,
        contact,
      });
      setApplication(nextApplication);
      setMessage("入驻申请已提交，请等待管理员审核");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交入驻申请失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <CardTitle>护航师入驻申请</CardTitle>
              <CardDescription className="mt-2">提交段位、KD、价格和个人简介，等待管理员审核。</CardDescription>
            </div>
            {application ? <Badge tone={application.status === "approved" ? "success" : "warning"}>{statusText[application.status]}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent>
          {application ? (
            <div className="mb-5 rounded-md border border-border bg-black/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">最近一次申请</p>
              <p className="mt-2">昵称：{application.nickname}</p>
              <p>段位：{application.rank}</p>
              <p>KD：{application.kd}</p>
              <p>价格：¥{application.price}/局</p>
              <p>提交时间：{new Date(application.created_at).toLocaleString("zh-CN")}</p>
            </div>
          ) : null}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                护航师昵称
                <Input name="nickname" placeholder="例如：夜枭" defaultValue={application?.nickname || ""} />
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
                每局价格
                <Input name="price" type="number" min={1} max={9999} placeholder="例如：88" defaultValue={application?.price || ""} />
              </label>
            </div>
            <label className="grid gap-2 text-sm">
              联系方式
              <Input name="contact" placeholder="手机号、微信或 QQ" defaultValue={application?.contact || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              个人简介
              <Textarea name="bio" placeholder="说明你擅长的地图、服务类型、在线时间和沟通方式。" defaultValue={application?.bio || ""} maxLength={500} />
            </label>
            {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交申请"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/user">返回用户中心</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
