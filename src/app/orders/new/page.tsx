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

const serviceOptions: { value: ServiceType; label: string }[] = [
  { value: "escort", label: "单局护航" },
  { value: "evacuation", label: "带撤离" },
  { value: "materials", label: "物资护送" },
  { value: "rank", label: "上分护航" },
  { value: "fun", label: "娱乐陪玩" },
];

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const escortId = searchParams.get("escortId") || "";
  const [escorts, setEscorts] = useState<Escort[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>("escort");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!selectedEscort) {
      setMessage("护航师不存在或暂不可接单。");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      escort_id: selectedEscort.id,
      service_type: serviceType,
      game_mode: String(formData.get("game_mode") || "").trim(),
      requirement: String(formData.get("requirement") || "").trim(),
      contact_wechat: String(formData.get("contact_wechat") || "").trim(),
      contact_qq: String(formData.get("contact_qq") || "").trim(),
    };

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

      router.push("/orders/success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交订单失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <p className="text-sm text-primary">订单创建</p>
        <h1 className="mt-2 text-3xl font-bold">创建护航订单</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">填写目标、联系方式和服务类型，护航师或客服会尽快联系你。</p>
      </div>

      <div className="mb-5">
        <RiskAlert />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-4">
          <Card className="border-emerald-300/20 bg-white/[0.04]">
            <CardHeader>
              <CardTitle>护航师信息</CardTitle>
              <CardDescription>确认接单对象和价格。</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEscort ? (
                <div className="grid gap-3 text-sm">
                  <p className="text-xl font-bold">{selectedEscort.nickname}</p>
                  <p className="text-muted-foreground">段位：{selectedEscort.rank || "未填写"}</p>
                  <p className="text-muted-foreground">KD：{Number(selectedEscort.kd || 0).toFixed(1)}</p>
                  <p className="text-emerald-300">价格：{formatMoney(selectedEscort.price)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">正在读取护航师信息，或该护航师暂不可接单。</p>
              )}
            </CardContent>
          </Card>
          <ContactServiceCard compact />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>订单资料</CardTitle>
            <CardDescription>微信或 QQ 至少填写一个。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
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
              <label className="grid gap-2 text-sm">
                游戏模式
                <Input name="game_mode" placeholder="例如：烽火地带 / 航天基地" maxLength={50} />
              </label>
              <label className="grid gap-2 text-sm">
                需求说明
                <Textarea name="requirement" placeholder="说明时间、目标、语音要求、装备风险等。" maxLength={500} />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  微信
                  <Input name="contact_wechat" placeholder="微信号" />
                </label>
                <label className="grid gap-2 text-sm">
                  QQ
                  <Input name="contact_qq" placeholder="QQ 号" />
                </label>
              </div>
              <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm">
                当前价格：{selectedEscort ? formatMoney(selectedEscort.price) : "待确认"}
              </div>
              {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting || !selectedEscort}>
                  {isSubmitting ? "提交中..." : "提交订单"}
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
