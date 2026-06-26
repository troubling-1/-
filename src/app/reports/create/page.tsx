"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLocalCurrentUser } from "@/lib/local-auth";
import { createLocalReport, type ReportTargetType } from "@/lib/local-reports";

function CreateReportContent() {
  const searchParams = useSearchParams();
  const targetType = (searchParams.get("targetType") || "order") as ReportTargetType;
  const targetId = searchParams.get("targetId") || "";
  const [reason, setReason] = useState("服务纠纷");
  const [detail, setDetail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const currentUser = getLocalCurrentUser();
    if (!currentUser) {
      setMessage("请先登录后再提交举报");
      return;
    }

    try {
      createLocalReport({
        reporter_id: currentUser.id,
        target_type: targetType === "escort" ? "escort" : "order",
        target_id: targetId,
        reason,
        detail,
      });
      setDetail("");
      setMessage("举报已提交，管理员会在后台处理");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交举报失败");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>提交举报</CardTitle>
          <CardDescription>举报订单或护航师异常行为，管理员会在后台查看和处理。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm">
              举报对象
              <Input value={`${targetType === "escort" ? "护航师" : "订单"}：${targetId || "未指定"}`} readOnly />
            </label>
            <label className="grid gap-2 text-sm">
              举报原因
              <Select value={reason} onChange={(event) => setReason(event.target.value)}>
                <option value="服务纠纷">服务纠纷</option>
                <option value="虚假资料">虚假资料</option>
                <option value="辱骂骚扰">辱骂骚扰</option>
                <option value="疑似违规">疑似违规</option>
                <option value="其他问题">其他问题</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm">
              详细说明
              <Textarea value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="请说明具体问题、发生时间和相关订单信息。" maxLength={500} />
            </label>
            {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit">提交举报</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/orders">返回订单中心</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateReportPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载举报表单...</div>}>
      <CreateReportContent />
    </Suspense>
  );
}
