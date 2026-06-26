"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Headphones, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLocalCurrentUser } from "@/lib/local-auth";
import { createLocalOrder } from "@/lib/local-orders";
import { escorts, services } from "@/lib/mock-data";
import type { ServiceType } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const serviceTips: Record<ServiceType, string> = {
  escort: "适合想找护航师陪打、协助任务和稳定沟通的玩家。",
  evacuation: "适合目标明确、想提高撤离成功率的玩家。",
  materials: "适合高价值物资局，优先保护背包和路线安全。",
  rank: "适合排位上分、练枪配合和团队节奏沟通。",
  fun: "适合休闲娱乐、熟悉地图和轻松陪玩。",
};

const quickRemarks = ["带撤离，优先稳定出图", "物资护送，不打无意义架", "上分护航，需要语音沟通"];

function CreateOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEscortId = searchParams.get("escortId") || escorts[0]?.id || "";
  const [serviceType, setServiceType] = useState<ServiceType>(services[0].value);
  const [escortId, setEscortId] = useState(defaultEscortId);
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = useMemo(() => services.find((item) => item.value === serviceType), [serviceType]);
  const selectedEscort = useMemo(() => escorts.find((item) => item.id === escortId), [escortId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const appointmentTime = String(formData.get("appointmentTime") || "").trim();
    const currentUser = getLocalCurrentUser();
    const cleanRemark = remark.trim();

    if (!currentUser) {
      setMessage("请先注册或登录后再下单。");
      return;
    }

    if (!escortId) {
      setMessage("请选择护航师。");
      return;
    }

    if (!selectedService) {
      setMessage("请选择正确的服务类型。");
      return;
    }

    if (!cleanRemark || cleanRemark.length < 5) {
      setMessage("需求说明至少填写 5 个字，方便护航师确认目标。");
      return;
    }

    if (!appointmentTime) {
      setMessage("请选择预约时间。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          escort_id: escortId,
          service_type: serviceType,
          price: selectedService.price,
          remark: cleanRemark,
          appointment_time: appointmentTime,
        }),
      });

      if (!response.ok) {
        throw new Error("提交订单失败，请稍后重试或联系客服。");
      }

      createLocalOrder({
        user_id: currentUser.id,
        escort_id: escortId,
        service_type: serviceType,
        price: selectedService.price,
        remark: cleanRemark,
        appointment_time: appointmentTime,
      });

      setMessage("订单已提交，等待护航师接单。");
      router.push("/orders");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交订单失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-5">
        <p className="text-sm text-primary">三角洲行动护航下单</p>
        <h1 className="mt-2 text-3xl font-bold">选择服务，填写目标，等待接单</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          表单只保留必要信息。下单前不确定服务、价格或时间，可以先联系客服确认。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.78fr]">
        <Card>
          <CardHeader className="p-4 sm:p-5">
            <CardTitle>创建订单</CardTitle>
            <CardDescription>选择服务、护航师和预约时间，简单说明目标即可。</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm">
                选择服务
                <Select value={serviceType} onChange={(event) => setServiceType(event.target.value as ServiceType)}>
                  {services.map((service) => (
                    <option key={service.value} value={service.value}>
                      {service.label} - {formatMoney(service.price)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="grid gap-2 text-sm">
                选择护航师
                <Select value={escortId} onChange={(event) => setEscortId(event.target.value)}>
                  {escorts.map((escort) => (
                    <option key={escort.id} value={escort.id}>
                      {escort.nickname} / {escort.rank} / {formatMoney(escort.price)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="grid gap-2 text-sm">
                预约时间
                <Input name="appointmentTime" type="datetime-local" />
              </label>

              <div className="grid gap-2 text-sm">
                需求说明
                <Textarea
                  name="remark"
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="例如：今晚 9 点后，优先带撤离，需要语音沟通。"
                  maxLength={500}
                />
                <div className="flex flex-wrap gap-2">
                  {quickRemarks.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="min-h-11 rounded-md border border-border bg-muted px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setRemark(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full">
                  {isSubmitting ? "提交中..." : "提交订单"}
                </Button>
                <Button asChild type="button" variant="outline" className="min-h-11 w-full">
                  <Link href="/chat">
                    <Headphones className="h-4 w-4" aria-hidden="true" />
                    联系客服
                  </Link>
                </Button>
                <Button asChild type="button" variant="outline" className="min-h-11 w-full">
                  <Link href="/orders">订单中心</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-bold">服务说明</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {selectedService ? serviceTips[selectedService.value] : "请选择服务类型。"}
              </p>
              <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                <p>当前服务：{selectedService?.label || "未选择"}</p>
                <p className="mt-1">参考价格：{selectedService ? formatMoney(selectedService.price) : "待确认"}</p>
                <p className="mt-1">护航师：{selectedEscort?.nickname || "未选择"}</p>
                <p className="mt-1">响应时间：{selectedEscort?.response_time || "待确认"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-bold">下单须知</h2>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
                <RuleItem text="下单前确认区服、时间、目标和语音方式。" />
                <RuleItem text="不要私下交易，避免售后无凭证。" />
                <RuleItem text="不确定选什么服务，可以先联系客服。" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-bold">常见问题</h2>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground">
                <p>护航师多久接单？在线护航师通常 3-10 分钟响应。</p>
                <p>可以指定玩法吗？可以，在需求说明里写清楚带撤离、物资护送或上分目标。</p>
                <p>订单有问题怎么办？保留站内订单记录，联系客服协助处理。</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-bold">退款规则</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                服务未开始且双方未确认，可以联系客服协助取消；服务已开始后，平台会按聊天记录、订单状态和完成情况处理。
              </p>
            </CardContent>
          </Card>

          <ContactServiceCard compact />
        </div>
      </div>
    </div>
  );
}

function RuleItem({ text }: { text: string }) {
  return (
    <p className="flex gap-2">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      {text}
    </p>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载订单表单...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}
