"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RiskAlert } from "@/components/site/risk-alert";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Order, Review } from "@/lib/types";

const reviewTags = ["准时", "沟通好", "技术强", "撤离成功", "态度好"];

function NewReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadOrderAndReview() {
      const token = await getCurrentAccessToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      if (!orderId) {
        setMessage("缺少订单编号。");
        setIsLoading(false);
        return;
      }

      const orderResponse = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orderResult = await orderResponse.json();

      if (!orderResponse.ok) {
        setMessage(orderResult.error || "读取订单失败。");
        setIsLoading(false);
        return;
      }

      const targetOrder = (orderResult.data || []).find((item: Order) => item.id === orderId) || null;
      setOrder(targetOrder);

      if (!targetOrder) {
        setMessage("订单不存在，或你无权评价该订单。");
        setIsLoading(false);
        return;
      }

      const reviewResponse = await fetch(`/api/reviews?orderId=${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reviewResult = await reviewResponse.json();

      if (reviewResponse.ok && reviewResult.data?.length) {
        setExistingReview(reviewResult.data[0]);
      }

      setIsLoading(false);
    }

    loadOrderAndReview();
  }, [orderId, router]);

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const token = await getCurrentAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const content = String(formData.get("content") || "").trim();

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          rating,
          content,
          tags: selectedTags,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "提交评价失败。");
      }

      router.push("/reviews/success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交评价失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canReview = order?.status === "completed" && !existingReview;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div>
        <p className="text-sm text-primary">订单评价</p>
        <h1 className="mt-2 text-3xl font-bold">评价护航师</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">评价会影响护航师信誉，请根据真实服务体验填写。</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-emerald-300/20 bg-white/[0.04]">
          <CardHeader>
            <CardTitle>评价内容</CardTitle>
            <CardDescription>只有已完成订单可以评价，每个订单只能评价一次。</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-muted-foreground">正在读取订单...</p> : null}
            {message ? <p className="mb-4 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
            {order ? (
              <div className="mb-4 rounded-md border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground">
                <p>订单编号：{order.id}</p>
                <p>护航师：{order.escorts?.nickname || order.escort_id}</p>
                <p>订单状态：{order.status}</p>
              </div>
            ) : null}
            {existingReview ? (
              <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm">
                该订单已评价，评分 {existingReview.rating} 分。
              </div>
            ) : null}
            {!canReview && !isLoading && !existingReview ? (
              <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                当前订单暂不能评价，请确认订单已完成。
              </div>
            ) : null}
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm">
                评分
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button key={value} type="button" variant={rating === value ? "default" : "outline"} onClick={() => setRating(value)} disabled={!canReview}>
                      {value} 分
                    </Button>
                  ))}
                </div>
              </label>
              <div className="grid gap-2 text-sm">
                标签
                <div className="flex flex-wrap gap-2">
                  {reviewTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="rounded-md border border-emerald-300/20 px-3 py-2 text-sm transition-colors hover:bg-emerald-300/10 disabled:opacity-50"
                      onClick={() => toggleTag(tag)}
                      disabled={!canReview}
                    >
                      <Badge tone={selectedTags.includes(tag) ? "success" : "muted"}>{tag}</Badge>
                    </button>
                  ))}
                </div>
              </div>
              <label className="grid gap-2 text-sm">
                文字评价
                <Textarea name="content" maxLength={500} placeholder="请描述服务态度、沟通、技术表现和结果。" disabled={!canReview} />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={!canReview || isSubmitting}>
                  {isSubmitting ? "提交中..." : "提交评价"}
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

export default function NewReviewPage() {
  return (
    <RoleGate allowedRoles={["customer", "admin"]}>
      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">正在加载评价表单...</div>}>
        <NewReviewContent />
      </Suspense>
    </RoleGate>
  );
}
