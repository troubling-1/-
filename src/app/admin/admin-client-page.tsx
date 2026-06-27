"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAccessToken } from "@/lib/auth-client";
import { adminOperationStats, platformStats, todayDeals } from "@/lib/operation-seed";
import type { EscortApplication, Order, OrderStatus, Report, ReportStatus, Review } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const applicationStatusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

const orderStatusText: Record<OrderStatus, string> = {
  pending: "待接单",
  accepted: "已接单",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
};

const reportStatusText: Record<ReportStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已解决",
  rejected: "已驳回",
};

function formatTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join("、");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

export function AdminClientPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<EscortApplication[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingAction, setReviewingAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | "all">("all");
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | "all">("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingReviewId, setUpdatingReviewId] = useState<string | null>(null);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  const pendingApplications = useMemo(() => applications.filter((item) => item.status === "pending"), [applications]);

  async function getTokenOrShowMessage() {
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录管理员账号。");
      return null;
    }

    return token;
  }

  async function loadApplications() {
    const token = await getTokenOrShowMessage();

    if (!token) {
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/admin/escort-applications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "读取护航师申请失败。");
      setIsLoading(false);
      return;
    }

    setApplications(result.data || []);
    setIsLoading(false);
  }

  async function loadOrders(status: OrderStatus | "all" = orderStatusFilter) {
    const token = await getTokenOrShowMessage();

    if (!token) return;

    const response = await fetch(`/api/orders?scope=admin&status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (response.ok) {
      setOrders(result.data || []);
    } else {
      setMessage(result.error || "读取订单失败。");
    }
  }

  async function loadReviews() {
    const token = await getTokenOrShowMessage();

    if (!token) return;

    const response = await fetch("/api/reviews?scope=admin", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (response.ok) {
      setReviews(result.data || []);
    } else {
      setMessage(result.error || "读取评价失败。");
    }
  }

  async function loadReports(status: ReportStatus | "all" = reportStatusFilter) {
    const token = await getTokenOrShowMessage();

    if (!token) return;

    const response = await fetch(`/api/reports?scope=admin&status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (response.ok) {
      setReports(result.data || []);
    } else {
      setMessage(result.error || "读取举报失败。");
    }
  }

  async function loadAll() {
    await Promise.all([loadApplications(), loadOrders(), loadReviews(), loadReports()]);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function changeOrderStatusFilter(status: OrderStatus | "all") {
    setOrderStatusFilter(status);
    await loadOrders(status);
  }

  async function changeReportStatusFilter(status: ReportStatus | "all") {
    setReportStatusFilter(status);
    await loadReports(status);
  }

  async function handleApplicationReview(applicationId: string, action: "approve" | "reject") {
    setMessage("");
    setReviewingAction({ id: applicationId, action });
    const token = await getTokenOrShowMessage();

    if (!token) {
      setReviewingAction(null);
      return;
    }

    const rejectReason = rejectReasons[applicationId]?.trim() || "";

    if (action === "reject" && rejectReason.length < 2) {
      setMessage("拒绝申请时需要填写至少 2 个字的原因。");
      setReviewingAction(null);
      return;
    }

    try {
      const response = await fetch("/api/admin/escort-applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: applicationId, action, reject_reason: rejectReason }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "审核失败。");
        setReviewingAction(null);
        return;
      }

      router.push(`/admin/review-success?type=${action === "approve" ? "approved" : "rejected"}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "审核失败，请稍后重试。");
      setReviewingAction(null);
    }
  }

  async function cancelOrder(orderId: string) {
    setMessage("");
    setUpdatingOrderId(orderId);
    const token = await getTokenOrShowMessage();

    if (!token) {
      setUpdatingOrderId(null);
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: orderId, status: "cancelled" }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "取消订单失败。");
      }

      setMessage("异常订单已取消。");
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "取消订单失败。");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function toggleReviewHidden(review: Review) {
    setMessage("");
    setUpdatingReviewId(review.id);
    const token = await getTokenOrShowMessage();

    if (!token) {
      setUpdatingReviewId(null);
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: review.id, hidden: !review.hidden }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "更新评价失败。");
      }

      setMessage(review.hidden ? "评价已恢复展示。" : "评价已隐藏。");
      await loadReviews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新评价失败。");
    } finally {
      setUpdatingReviewId(null);
    }
  }

  async function updateReportStatus(report: Report, status: ReportStatus) {
    setMessage("");
    setUpdatingReportId(report.id);
    const token = await getTokenOrShowMessage();

    if (!token) {
      setUpdatingReportId(null);
      return;
    }

    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: report.id,
          status,
          admin_note: reportNotes[report.id] || report.admin_note || "",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "处理举报失败。");
      }

      setMessage("举报处理状态已更新。");
      await loadReports();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "处理举报失败。");
    } finally {
      setUpdatingReportId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div>
        <p className="text-sm text-primary">管理后台</p>
        <h1 className="mt-2 text-3xl font-bold">运营数据看板</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">用于快速查看成交、用户、护航师和风控处理状态。</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard title="累计成交额" value={formatMoney(adminOperationStats.grossMerchandiseValue)} text="种子运营展示口径" />
        <StatCard title="本月订单" value={`${adminOperationStats.monthlyOrders}`} text="含已完成和进行中订单" />
        <StatCard title="今日新增用户" value={`${adminOperationStats.newUsersToday}`} text={`活跃用户 ${platformStats.activeUsers}`} />
        <StatCard title="护航师在线率" value={`${adminOperationStats.escortOnlineRate}%`} text="认证护航师在线占比" />
      </div>

      <Card className="mt-6 border-emerald-300/20 bg-emerald-300/[0.05]">
        <CardHeader>
          <CardTitle>今日成交滚动</CardTitle>
          <CardDescription>用于运营观察和首页成交氛围展示。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {todayDeals.map((deal) => (
            <div key={deal.id} className="rounded-md border border-white/10 bg-black/25 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <p className="font-medium">{deal.user} / {deal.service}</p>
                <p className="text-emerald-300">{formatMoney(deal.amount)}</p>
              </div>
              <p className="mt-2 text-muted-foreground">护航师 {deal.escort}，{deal.status}，{deal.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard title="全部申请" value={`${applications.length}`} text="护航师入驻" />
        <StatCard title="待审核申请" value={`${pendingApplications.length}`} text="需要人工处理" />
        <StatCard title="订单数量" value={`${orders.length}`} text="当前筛选结果" />
        <StatCard title="待处理举报" value={`${reports.filter((item) => item.status === "pending").length}`} text="风控优先级高" />
      </div>

      {message ? <p className="mt-6 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>护航师申请审核</CardTitle>
          <CardDescription>通过后会同步用户身份为护航师；拒绝时用户可在个人中心看到原因。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isLoading ? <p className="text-sm text-muted-foreground">正在加载申请...</p> : null}
          {!isLoading && applications.length === 0 ? <EmptyText>暂无护航师申请。</EmptyText> : null}

          {applications.map((application) => {
            const isReviewingApprove = reviewingAction?.id === application.id && reviewingAction.action === "approve";
            const isReviewingReject = reviewingAction?.id === application.id && reviewingAction.action === "reject";
            const isAnyReviewing = Boolean(reviewingAction);
            const canReview = application.status === "pending" && !isAnyReviewing;

            return (
              <div key={application.id} className="grid gap-4 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{application.nickname}</p>
                    <Badge tone={application.status === "approved" ? "success" : application.status === "pending" ? "warning" : "muted"}>
                      {applicationStatusText[application.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p>游戏 ID：{application.game_id}</p>
                    <p>段位：{application.rank}</p>
                    <p>KD：{application.kd}</p>
                    <p>价格：{formatMoney(application.price)}/局</p>
                    <p>微信：{application.contact_wechat || "未填写"}</p>
                    <p>QQ：{application.contact_qq || "未填写"}</p>
                    <p>擅长模式：{formatTags(application.good_at_modes) || "未填写"}</p>
                    <p>擅长地图：{formatTags(application.good_at_maps) || "未填写"}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">简介：{application.intro}</p>
                  {application.reject_reason ? <p className="mt-2 text-sm text-destructive">拒绝原因：{application.reject_reason}</p> : null}
                </div>

                <div className="grid gap-3">
                  <Textarea
                    placeholder="拒绝时填写原因"
                    value={rejectReasons[application.id] || ""}
                    onChange={(event) => setRejectReasons((current) => ({ ...current, [application.id]: event.target.value }))}
                    disabled={application.status !== "pending" || isAnyReviewing}
                  />
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <Button type="button" variant="outline" disabled={!canReview} onClick={() => handleApplicationReview(application.id, "approve")}>
                      {isReviewingApprove ? "处理中..." : "通过申请"}
                    </Button>
                    <Button type="button" variant="danger" disabled={!canReview} onClick={() => handleApplicationReview(application.id, "reject")}>
                      {isReviewingReject ? "处理中..." : "拒绝申请"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>订单管理</CardTitle>
          <CardDescription>管理员可以查看所有订单，并取消异常订单。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "accepted", "in_progress", "completed", "cancelled"] as Array<OrderStatus | "all">).map((status) => (
              <Button key={status} type="button" variant={orderStatusFilter === status ? "default" : "outline"} onClick={() => changeOrderStatusFilter(status)}>
                {status === "all" ? "全部" : orderStatusText[status]}
              </Button>
            ))}
          </div>
          {orders.length === 0 ? <EmptyText>暂无订单。</EmptyText> : null}
          {orders.map((order) => (
            <div key={order.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{order.id}</p>
                  <Badge tone={order.status === "completed" ? "success" : order.status === "cancelled" ? "muted" : "warning"}>{orderStatusText[order.status]}</Badge>
                </div>
                <p>玩家：{order.customer?.nickname || order.customer_id || order.user_id}</p>
                <p>护航师：{order.escorts?.nickname || order.escort_id}</p>
                <p>服务：{order.service_type} / 模式：{order.game_mode || "未填写"} / 价格：{formatMoney(order.price)}</p>
                <p>需求：{order.requirement || order.remark || "无"}</p>
              </div>
              {order.status !== "completed" && order.status !== "cancelled" ? (
                <Button type="button" variant="danger" disabled={updatingOrderId === order.id} onClick={() => cancelOrder(order.id)}>
                  {updatingOrderId === order.id ? "处理中..." : "取消异常订单"}
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>评价管理</CardTitle>
          <CardDescription>管理员可以隐藏违规评价，但不会删除原始记录。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {reviews.length === 0 ? <EmptyText>暂无评价。</EmptyText> : null}
          {reviews.map((review) => (
            <div key={review.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{review.id}</p>
                  <Badge tone={review.hidden ? "muted" : "success"}>{review.hidden ? "已隐藏" : "展示中"}</Badge>
                </div>
                <p>订单：{review.order_id}</p>
                <p>护航师：{review.escort_id}</p>
                <p>评分：{review.rating} 分 / 标签：{review.tags?.length ? review.tags.join("、") : "无"}</p>
                <p>内容：{review.content}</p>
              </div>
              <Button type="button" variant="outline" disabled={updatingReviewId === review.id} onClick={() => toggleReviewHidden(review)}>
                {updatingReviewId === review.id ? "处理中..." : review.hidden ? "恢复展示" : "隐藏评价"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>举报管理</CardTitle>
          <CardDescription>管理员可以标记处理中、已解决或驳回，并填写处理备注。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "processing", "resolved", "rejected"] as Array<ReportStatus | "all">).map((status) => (
              <Button key={status} type="button" variant={reportStatusFilter === status ? "default" : "outline"} onClick={() => changeReportStatusFilter(status)}>
                {status === "all" ? "全部" : reportStatusText[status]}
              </Button>
            ))}
          </div>
          {reports.length === 0 ? <EmptyText>暂无举报。</EmptyText> : null}
          {reports.map((report) => (
            <div key={report.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_320px]">
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{report.id}</p>
                  <Badge tone={report.status === "resolved" ? "success" : report.status === "rejected" ? "muted" : "warning"}>{reportStatusText[report.status]}</Badge>
                </div>
                <p>举报类型：{report.type}</p>
                <p>订单：{report.order_id || "无"} / 评价：{report.review_id || "无"} / 目标用户：{report.target_user_id || "无"}</p>
                <p>原因：{report.reason}</p>
                <p>说明：{report.description}</p>
                <p>处理备注：{report.admin_note || "暂无"}</p>
              </div>
              <div className="grid gap-3">
                <Textarea
                  placeholder="填写处理备注"
                  value={reportNotes[report.id] ?? report.admin_note ?? ""}
                  onChange={(event) => setReportNotes((current) => ({ ...current, [report.id]: event.target.value }))}
                  maxLength={500}
                />
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <Button type="button" variant="outline" disabled={updatingReportId === report.id} onClick={() => updateReportStatus(report, "processing")}>
                    标记处理中
                  </Button>
                  <Button type="button" variant="outline" disabled={updatingReportId === report.id} onClick={() => updateReportStatus(report, "resolved")}>
                    标记已解决
                  </Button>
                  <Button type="button" variant="danger" disabled={updatingReportId === report.id} onClick={() => updateReportStatus(report, "rejected")}>
                    驳回举报
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, text }: { title: string; value: string; text?: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.04]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-emerald-200">{value}</p>
        {text ? <p className="mt-2 text-xs text-muted-foreground">{text}</p> : null}
      </CardContent>
    </Card>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-border bg-black/30 p-4 text-sm text-muted-foreground">{children}</p>;
}
