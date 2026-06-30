"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Escort, EscortApplication, Order, OrderStatus, Report, ReportStatus, Review } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const applicationStatusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

const orderStatusText: Record<OrderStatus, string> = {
  pending_payment: "待支付",
  pending: "待接单",
  accepted: "已接单",
  in_progress: "服务中",
  pending_confirm: "待确认",
  completed: "已完成",
  cancelled: "已取消",
  disputed: "申诉中",
};

const reportStatusText: Record<ReportStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已解决",
  rejected: "已驳回",
};

const orderFilters: Array<OrderStatus | "all"> = [
  "all",
  "pending_payment",
  "pending",
  "accepted",
  "in_progress",
  "pending_confirm",
  "completed",
  "cancelled",
  "disputed",
];

const reportFilters: Array<ReportStatus | "all"> = ["all", "pending", "processing", "resolved", "rejected"];

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
  const [escorts, setEscorts] = useState<Escort[]>([]);
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
  const activeEscorts = useMemo(() => escorts.filter((item) => item.status === "active" || item.approved), [escorts]);
  const completedOrders = useMemo(() => orders.filter((item) => item.status === "completed"), [orders]);
  const runningOrders = useMemo(() => orders.filter((item) => item.status === "accepted" || item.status === "in_progress" || item.status === "pending_confirm"), [orders]);
  const pendingReports = useMemo(() => reports.filter((item) => item.status === "pending" || item.status === "processing"), [reports]);
  const totalAmount = useMemo(() => completedOrders.reduce((sum, order) => sum + order.price, 0), [completedOrders]);
  const platformFee = useMemo(() => completedOrders.reduce((sum, order) => sum + (Number(order.platform_fee) || order.price * 0.12), 0), [completedOrders]);
  const todayOrderCount = useMemo(() => {
    const todayText = new Date().toLocaleDateString("zh-CN");
    return orders.filter((order) => new Date(order.created_at).toLocaleDateString("zh-CN") === todayText).length;
  }, [orders]);

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

    if (!token) return;

    const response = await fetch("/api/admin/escort-applications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (response.ok) {
      setApplications(result.data || []);
      setEscorts(result.escorts || []);
    } else {
      setMessage(result.error || "读取护航师申请失败。");
    }
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
    setIsLoading(true);
    await Promise.all([loadApplications(), loadOrders(), loadReviews(), loadReports()]);
    setIsLoading(false);
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
        throw new Error(result.error || "审核失败。");
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
        body: JSON.stringify({ id: orderId, action: "cancel", cancel_reason: "管理员取消异常订单" }),
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

  async function markOrderDisputed(orderId: string) {
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
        body: JSON.stringify({ id: orderId, action: "dispute" }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "标记申诉失败。");
      }

      setMessage("订单已标记为申诉中。");
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "标记申诉失败。");
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
        <p className="mt-2 text-sm leading-6 text-muted-foreground">查看订单、护航师、评价和举报处理状态。</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard title="总订单数" value={`${orders.length}`} text="当前筛选范围内订单" />
        <StatCard title="今日订单数" value={`${todayOrderCount}`} text="按创建时间统计" />
        <StatCard title="已完成订单" value={`${completedOrders.length}`} text="玩家已确认完成" />
        <StatCard title="进行中订单" value={`${runningOrders.length}`} text="已接单、服务中、待确认" />
        <StatCard title="总成交额" value={formatMoney(totalAmount)} text="已完成订单金额" />
        <StatCard title="平台服务费" value={formatMoney(platformFee)} text="按订单服务费字段统计" />
        <StatCard title="待处理申诉" value={`${pendingReports.length}`} text="举报待处理或处理中" />
        <StatCard title="Active 护航师" value={`${activeEscorts.length}`} text="可接单护航师资料" />
      </div>

      {message ? <p className="mt-6 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
      {isLoading ? <p className="mt-6 text-sm text-muted-foreground">正在加载后台数据...</p> : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>护航师申请审核</CardTitle>
          <CardDescription>通过后同步用户身份和 escorts 资料；拒绝时需要填写原因。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {applications.length === 0 ? <EmptyText>暂无护航师申请。</EmptyText> : null}
          {applications.map((application) => {
            const isReviewingApprove = reviewingAction?.id === application.id && reviewingAction.action === "approve";
            const isReviewingReject = reviewingAction?.id === application.id && reviewingAction.action === "reject";
            const canReview = application.status === "pending" && !reviewingAction;

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
                    disabled={application.status !== "pending" || Boolean(reviewingAction)}
                  />
                  <Button type="button" variant="outline" disabled={!canReview} onClick={() => handleApplicationReview(application.id, "approve")}>
                    {isReviewingApprove ? "处理中..." : "通过申请"}
                  </Button>
                  <Button type="button" variant="danger" disabled={!canReview} onClick={() => handleApplicationReview(application.id, "reject")}>
                    {isReviewingReject ? "处理中..." : "拒绝申请"}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>订单管理</CardTitle>
          <CardDescription>管理员可查看全部订单，取消异常订单，或标记申诉中。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {orderFilters.map((status) => (
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
                  <p className="font-medium text-foreground">{order.order_no || order.id}</p>
                  <Badge tone={order.status === "completed" ? "success" : order.status === "cancelled" ? "muted" : "warning"}>{orderStatusText[order.status]}</Badge>
                </div>
                <p>玩家：{order.customer?.nickname || order.customer_id || order.user_id}</p>
                <p>护航师：{order.escorts?.nickname || order.escort_id || "平台推荐"}</p>
                <p>游戏：{order.game_name || "未填写"} / 服务：{order.service_type} / 金额：{formatMoney(order.price)}</p>
                <p>联系方式：微信 {order.contact_wechat || "未填写"} / QQ {order.contact_qq || "未填写"} / 手机 {order.contact_phone || "未填写"}</p>
                <p>需求：{order.requirement || order.remark || "无"}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <a href={`/orders/${order.id}`}>查看详情</a>
                </Button>
                {order.status !== "completed" && order.status !== "cancelled" ? (
                  <Button type="button" variant="danger" disabled={updatingOrderId === order.id} onClick={() => cancelOrder(order.id)}>
                    {updatingOrderId === order.id ? "处理中..." : "取消异常订单"}
                  </Button>
                ) : null}
                {order.status !== "disputed" && order.status !== "cancelled" ? (
                  <Button type="button" variant="outline" disabled={updatingOrderId === order.id} onClick={() => markOrderDisputed(order.id)}>
                    标记申诉中
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>评价管理</CardTitle>
          <CardDescription>管理员可以隐藏违规评价，但不删除原始记录。</CardDescription>
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
            {reportFilters.map((status) => (
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
