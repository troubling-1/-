"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RiskAlert } from "@/components/site/risk-alert";
import { RoleGate } from "@/components/site/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Escort, ServiceType } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const gameOptions = [
  "三角洲行动",
  "无畏契约",
  "英雄联盟",
  "王者荣耀",
  "和平精英",
  "永劫无间",
  "绝地求生",
  "CS2",
  "Apex 英雄",
  "原神",
  "鸣潮",
  "崩坏：星穹铁道",
  "云顶之弈",
  "DNF",
  "穿越火线",
];

const serviceOptions: { value: ServiceType; label: string }[] = [
  { value: "fun_play", label: "娱乐陪玩" },
  { value: "rank_boost", label: "上分护航" },
  { value: "rank_coach", label: "排位陪练" },
  { value: "evacuation", label: "带撤离" },
  { value: "materials", label: "物资护送" },
  { value: "task", label: "任务代肝" },
  { value: "dungeon", label: "副本协助" },
  { value: "newbie", label: "新手教学" },
  { value: "voice", label: "语音陪玩" },
  { value: "custom", label: "定制服务" },
];

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEscortId = searchParams.get("escortId") || "";
  const [escorts, setEscorts] = useState<Escort[]>([]);
  const [escortId, setEscortId] = useState(initialEscortId);
  const [gameName, setGameName] = useState("三角洲行动");
  const [serviceType, setServiceType] = useState<ServiceType>("evacuation");
  const [durationHours, setDurationHours] = useState(1);
  const [startMode, setStartMode] = useState<"now" | "reserve">("now");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadEscorts() {
      const response = await fetch("/api/escorts");
      const result = await response.json();

      if (response.ok) {
        setEscorts(result.data || []);
      }
    }

    loadEscorts();
  }, []);

  const selectedEscort = useMemo(() => escorts.find((escort) => escort.id === escortId) || null, [escorts, escortId]);
  const unitPrice = selectedEscort ? Number(selectedEscort.price) || 88 : 88;
  const estimatedPrice = Math.max(1, unitPrice * durationHours);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const reserveTime = String(formData.get("start_time") || "").trim();
    const payload = {
      escort_id: escortId || null,
      game_name: gameName,
      service_type: serviceType,
      game_mode: String(formData.get("game_mode") || "").trim(),
      server_region: String(formData.get("server_region") || "").trim(),
      start_time: startMode === "reserve" ? reserveTime : "",
      duration_hours: durationHours,
      requirement: String(formData.get("requirement") || "").trim(),
      contact_wechat: String(formData.get("contact_wechat") || "").trim(),
      contact_qq: String(formData.get("contact_qq") || "").trim(),
      contact_phone: String(formData.get("contact_phone") || "").trim(),
    };

    if (startMode === "reserve" && !reserveTime) {
      setMessage("请选择预约开始时间。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "提交订单失败。");
      }

      router.push(`/orders/pay/${result.data.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交订单失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <p className="text-sm text-primary">订单闭环 V1</p>
        <h1 className="mt-2 text-3xl font-bold">创建护航订单</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">选择游戏、服务和联系方式，提交后进入模拟支付确认。</p>
      </div>

      <div className="mb-5">
        <RiskAlert />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid content-start gap-4">
          <Card className="border-emerald-300/20 bg-white/[0.04]">
            <CardHeader>
              <CardTitle>价格预估</CardTitle>
              <CardDescription>平台推荐按基础价估算，指定护航师按护航师报价估算。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p>接单方式：{selectedEscort ? selectedEscort.nickname : "平台推荐"}</p>
              <p>单价：{formatMoney(unitPrice)} / 小时</p>
              <p className="text-2xl font-bold text-emerald-200">{formatMoney(estimatedPrice)}</p>
              <p className="text-muted-foreground">最终金额以提交订单后的记录为准。</p>
            </CardContent>
          </Card>
          <ContactServiceCard compact />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>订单资料</CardTitle>
            <CardDescription>微信、QQ、手机号至少填写一个。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  游戏
                  <Select value={gameName} onChange={(event) => setGameName(event.target.value)}>
                    {gameOptions.map((game) => (
                      <option key={game} value={game}>
                        {game}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-2 text-sm">
                  服务类型
                  <Select value={serviceType} onChange={(event) => setServiceType(event.target.value as ServiceType)}>
                    {serviceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <label className="grid gap-2 text-sm">
                护航师
                <Select value={escortId} onChange={(event) => setEscortId(event.target.value)}>
                  <option value="">平台推荐</option>
                  {escorts.map((escort) => (
                    <option key={escort.id} value={escort.id}>
                      {escort.nickname} / {formatMoney(Number(escort.price) || 0)}
                    </option>
                  ))}
                </Select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  游戏模式
                  <Input name="game_mode" placeholder="例如：排位、带撤离、航天基地" maxLength={50} />
                </label>
                <label className="grid gap-2 text-sm">
                  服务器 / 区服
                  <Input name="server_region" placeholder="例如：微信区、艾欧尼亚、国服" maxLength={50} />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  开始时间
                  <Select value={startMode} onChange={(event) => setStartMode(event.target.value as "now" | "reserve")}>
                    <option value="now">立即开始</option>
                    <option value="reserve">预约时间</option>
                  </Select>
                </label>
                <label className="grid gap-2 text-sm">
                  服务时长（小时）
                  <Input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={durationHours}
                    onChange={(event) => setDurationHours(Number(event.target.value) || 1)}
                  />
                </label>
              </div>

              {startMode === "reserve" ? (
                <label className="grid gap-2 text-sm">
                  预约开始时间
                  <Input name="start_time" type="datetime-local" />
                </label>
              ) : null}

              <label className="grid gap-2 text-sm">
                需求说明
                <Textarea name="requirement" placeholder="说明目标、语音要求、装备风险、地图或段位等。" maxLength={500} />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  微信
                  <Input name="contact_wechat" placeholder="微信号" />
                </label>
                <label className="grid gap-2 text-sm">
                  QQ
                  <Input name="contact_qq" placeholder="QQ 号" />
                </label>
                <label className="grid gap-2 text-sm">
                  手机号
                  <Input name="contact_phone" placeholder="手机号" />
                </label>
              </div>

              <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6">
                请勿私下交易，请勿提前转账给个人。平台仅保障站内订单，异常情况请举报或联系客服。
              </div>

              {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "提交订单并去支付"}
                </Button>
                <Button asChild variant="outline" type="button">
                  <Link href="/chat">联系客服</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <RoleGate allowedRoles={["customer", "admin"]}>
      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载订单表单...</div>}>
        <NewOrderContent />
      </Suspense>
    </RoleGate>
  );
}
