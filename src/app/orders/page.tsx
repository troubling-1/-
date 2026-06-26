"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLocalCurrentUser } from "@/lib/local-auth";
import { getLocalOrders, getNextOrderStatus, updateLocalOrderStatus } from "@/lib/local-orders";
import { createLocalReview, getLocalReviewByOrderId } from "@/lib/local-reviews";
import { escorts, services } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const statusText: Record<OrderStatus, string> = {
  pending: "待接单",
  accepted: "已接单",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
};

const nextStatusActionText: Partial<Record<OrderStatus, string>> = {
  pending: "护航师接单",
  accepted: "开始订单",
  in_progress: "完成订单",
};

function getStatusTone(status: OrderStatus) {
  if (status === "completed") {
    return "success";
  }

  if (status === "in_progress" || status === "accepted") {
    return "warning";
  }

  if (status === "cancelled") {
    return "muted";
  }

  return "default";
}

export default function OrdersPage() {
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewContent, setReviewContent] = useState("");
  const [message, setMessage] = useState("");

  function syncOrders() {
    setOrderList(getLocalOrders());
  }

  useEffect(() => {
    syncOrders();
    window.addEventListener("delta-escort-orders-change", syncOrders);
    window.addEventListener("delta-escort-reviews-change", syncOrders);
    window.addEventListener("storage", syncOrders);

    return () => {
      window.removeEventListener("delta-escort-orders-change", syncOrders);
      window.removeEventListener("delta-escort-reviews-change", syncOrders);
      window.removeEventListener("storage", syncOrders);
    };
  }, []);

  function handleStatusChange(orderId: string, status: OrderStatus) {
    updateLocalOrderStatus(orderId, status);
    syncOrders();
  }

  function openCancelForm(orderId: string) {
    setMessage("");
    setCancelOrderId(orderId);
    setCancelReason("");
  }

  function submitCancel(orderId: string) {
    const reason = cancelReason.trim();

    if (reason.length < 2 || reason.length > 100) {
      setMessage("取消原因需要填写 2 到 100 个字");
      return;
    }

    updateLocalOrderStatus(orderId, "cancelled", reason);
    setCancelOrderId(null);
    setCancelReason("");
    setMessage("订单已取消");
    syncOrders();
  }

  function openReviewForm(orderId: string) {
    setMessage("");
    setReviewOrderId(orderId);
    setReviewRating("5");
    setReviewContent("");
  }

  function submitReview(order: Order) {
    const currentUser = getLocalCurrentUser();

    if (!currentUser) {
      setMessage("请先登录后再评价");
      return;
    }

    try {
      createLocalReview({
        order_id: order.id,
        user_id: currentUser.id,
        escort_id: order.escort_id,
        rating: Number(reviewRating),
        content: reviewContent,
      });
      setReviewOrderId(null);
      setReviewContent("");
      setMessage("评价已提交");
      syncOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交评价失败");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">订单中心</h1>
      <p className="mt-2 text-sm text-muted-foreground">订单支持状态流转、取消原因、完成后评价和异常举报。</p>
      {message ? <p className="mt-4 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
      <div className="mt-6 grid gap-4">
        {orderList.map((order) => {
          const service = services.find((item) => item.value === order.service_type);
          const escort = escorts.find((item) => item.id === order.escort_id);
          const nextStatus = getNextOrderStatus(order.status);
          const canCancel = order.status !== "completed" && order.status !== "cancelled";
          const existingReview = getLocalReviewByOrderId(order.id);

          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <CardTitle>{service?.label || "未知服务"}</CardTitle>
                  <Badge tone={getStatusTone(order.status)}>{statusText[order.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-muted-foreground">
                <div className="grid gap-3 md:grid-cols-4">
                  <p>订单号：{order.id}</p>
                  <p>护航师：{escort?.nickname || "未知护航师"}</p>
                  <p>价格：{formatMoney(order.price)}</p>
                  <p>预约：{order.appointment_time ? new Date(order.appointment_time).toLocaleString("zh-CN") : "未填写"}</p>
                </div>
                <p>备注：{order.remark || "无"}</p>
                {order.status === "cancelled" ? (
                  <div className="rounded-md border border-border bg-black/30 p-3">
                    <p>取消原因：{order.cancel_reason || "未填写"}</p>
                    <p className="mt-1">取消时间：{order.cancelled_at ? new Date(order.cancelled_at).toLocaleString("zh-CN") : "未记录"}</p>
                  </div>
                ) : null}
                {existingReview ? (
                  <div className="rounded-md border border-border bg-black/30 p-3">
                    <p className="text-primary">{"★".repeat(existingReview.rating)}</p>
                    <p className="mt-1">我的评价：{existingReview.content}</p>
                  </div>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {nextStatus ? (
                    <Button type="button" onClick={() => handleStatusChange(order.id, nextStatus)}>
                      {nextStatusActionText[order.status]}
                    </Button>
                  ) : null}
                  {canCancel ? (
                    <Button type="button" variant="outline" onClick={() => openCancelForm(order.id)}>
                      取消订单
                    </Button>
                  ) : null}
                  {order.status === "completed" && !existingReview ? (
                    <Button type="button" variant="outline" onClick={() => openReviewForm(order.id)}>
                      评价订单
                    </Button>
                  ) : null}
                  <Button asChild type="button" variant="outline">
                    <Link href={`/reports/create?targetType=order&targetId=${order.id}`}>举报订单</Link>
                  </Button>
                </div>
                {cancelOrderId === order.id ? (
                  <div className="grid gap-3 rounded-md border border-border bg-black/30 p-4">
                    <label className="grid gap-2 text-sm">
                      取消原因
                      <Input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="例如：临时有事，无法按预约时间进行" maxLength={100} />
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="button" variant="danger" onClick={() => submitCancel(order.id)}>
                        确认取消
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setCancelOrderId(null)}>
                        先不取消
                      </Button>
                    </div>
                  </div>
                ) : null}
                {reviewOrderId === order.id ? (
                  <div className="grid gap-3 rounded-md border border-border bg-black/30 p-4">
                    <label className="grid gap-2 text-sm">
                      评分
                      <Select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
                        <option value="5">5 分，非常满意</option>
                        <option value="4">4 分，比较满意</option>
                        <option value="3">3 分，一般</option>
                        <option value="2">2 分，不太满意</option>
                        <option value="1">1 分，很不满意</option>
                      </Select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      评价内容
                      <Textarea value={reviewContent} onChange={(event) => setReviewContent(event.target.value)} placeholder="说说这次护航体验。" maxLength={300} />
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="button" onClick={() => submitReview(order)}>
                        提交评价
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setReviewOrderId(null)}>
                        取消
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
