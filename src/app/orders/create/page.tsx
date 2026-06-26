"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLocalOrder } from "@/lib/local-orders";
import { getLocalCurrentUser } from "@/lib/local-auth";
import { escorts, services } from "@/lib/mock-data";
import type { ServiceType } from "@/lib/types";

function CreateOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEscortId = searchParams.get("escortId") || escorts[0]?.id || "";
  const [serviceType, setServiceType] = useState<ServiceType>(services[0].value);
  const [escortId, setEscortId] = useState(defaultEscortId);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = useMemo(() => services.find((item) => item.value === serviceType), [serviceType]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const remark = String(formData.get("remark") || "").trim();
    const appointmentTime = String(formData.get("appointmentTime") || "").trim();
    const currentUser = getLocalCurrentUser();

    if (!currentUser) {
      setMessage("请先注册或登录后再下单");
      return;
    }

    if (!escortId) {
      setMessage("请选择护航师");
      return;
    }

    if (!selectedService) {
      setMessage("请选择正确的服务类型");
      return;
    }

    if (!remark || remark.length < 5) {
      setMessage("需求说明至少填写 5 个字");
      return;
    }

    if (!appointmentTime) {
      setMessage("请选择预约时间");
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          escort_id: escortId,
          service_type: serviceType,
          price: selectedService.price,
          remark,
          appointment_time: appointmentTime,
        }),
      });

      createLocalOrder({
        user_id: currentUser.id,
        escort_id: escortId,
        service_type: serviceType,
        price: selectedService.price,
        remark,
        appointment_time: appointmentTime,
      });

      setMessage("订单已提交，等待护航师接单");
      router.push("/orders");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交订单失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>创建订单</CardTitle>
          <CardDescription>选择服务、护航师、预约时间，并写清楚你的需求。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm">
              选择服务
              <Select value={serviceType} onChange={(event) => setServiceType(event.target.value as ServiceType)}>
                {services.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label} - ¥{service.price}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm">
              选择护航师
              <Select value={escortId} onChange={(event) => setEscortId(event.target.value)}>
                {escorts.map((escort) => (
                  <option key={escort.id} value={escort.id}>
                    {escort.nickname} / {escort.rank}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm">
              预约时间
              <Input name="appointmentTime" type="datetime-local" />
            </label>
            <label className="grid gap-2 text-sm">
              需求说明
              <Textarea name="remark" placeholder="例如：今晚 9 点后，优先带撤离，需要语音沟通。" maxLength={500} />
            </label>
            {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交订单"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/orders">查看订单中心</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载订单表单...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}
