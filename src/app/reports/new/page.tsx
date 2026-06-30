"use client";

import { Suspense, useState } from "react";
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
import type { ReportType } from "@/lib/types";

const reportTypeOptions: { value: ReportType; label: string }[] = [
  { value: "no_show", label: "未按时服务" },
  { value: "bad_attitude", label: "态度差" },
  { value: "private_trade", label: "私下交易" },
  { value: "fraud", label: "欺诈" },
  { value: "abuse", label: "辱骂" },
  { value: "other", label: "其他" },
];

function NewReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<ReportType>((searchParams.get("type") as ReportType) || "other");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      target_user_id: String(formData.get("target_user_id") || "").trim(),
      order_id: String(formData.get("order_id") || "").trim(),
      review_id: String(formData.get("review_id") || "").trim(),
      type,
      reason: reason.trim(),
      description: String(formData.get("description") || "").trim(),
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "提交举报失败。");
      }

      router.push("/center?reports=1");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交举报失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  const defaultOrderId = searchParams.get("orderId") || (searchParams.get("targetType") === "order" ? searchParams.get("targetId") || "" : "");
  const defaultReviewId = searchParams.get("reviewId") || "";
  const defaultTargetUserId = searchParams.get("targetUserId") || "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div>
        <p className="text-sm text-primary">风控举报</p>
        <h1 className="mt-2 text-3xl font-bold">提交举报</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">请尽量提供订单、评价或用户编号，平台会根据记录处理。</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>举报信息</CardTitle>
            <CardDescription>与订单相关的举报，只允许订单参与方提交。</CardDescription>
          </CardHeader>
          <CardContent>
            {message ? <p className="mb-4 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  订单编号
                  <Input name="order_id" defaultValue={defaultOrderId} placeholder="可选" />
                </label>
                <label className="grid gap-2 text-sm">
                  评价编号
                  <Input name="review_id" defaultValue={defaultReviewId} placeholder="可选" />
                </label>
                <label className="grid gap-2 text-sm">
                  用户编号
                  <Input name="target_user_id" defaultValue={defaultTargetUserId} placeholder="可选" />
                </label>
              </div>
              <label className="grid gap-2 text-sm">
                举报类型
                <Select value={type} onChange={(event) => setType(event.target.value as ReportType)}>
                  {reportTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm">
                举报原因
                <Input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={80} placeholder="例如：服务迟到且拒绝沟通" />
              </label>
              <label className="grid gap-2 text-sm">
                详细说明
                <Textarea name="description" maxLength={1000} placeholder="请写清楚时间、订单情况、沟通过程和需要平台处理的诉求。" />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "提交举报"}
                </Button>
                <Button asChild variant="outline" type="button">
                  <Link href="/orders">返回订单中心</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <RiskAlert />
          <ContactServiceCard compact />
        </div>
      </div>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <RoleGate allowedRoles={["customer", "escort", "admin"]}>
      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载举报表单...</div>}>
        <NewReportContent />
      </Suspense>
    </RoleGate>
  );
}
