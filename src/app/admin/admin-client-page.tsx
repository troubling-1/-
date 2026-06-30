"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { Escort, EscortApplication, Order, OrderStatus, Report, ReportStatus, Review, Withdraw, WithdrawStatus } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const applicationStatusText = { pending: "待审核", approved: "已通过", rejected: "已拒绝" };
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
const reportStatusText: Record<ReportStatus, string> = { pending: "待处理", processing: "处理中", resolved: "已解决", rejected: "已驳回" };
const withdrawStatusText: Record<WithdrawStatus, string> = {
  pending: "待审核",
  approved: "已通过",
  paid: "已打款",
  rejected: "已拒绝",
  cancelled: "已取消",
};
const orderFilters: Array<OrderStatus | "all"> = ["all", "pending_payment", "pending", "accepted", "in_progress", "pending_confirm", "completed", "cancelled", "disputed"];
const reportFilters: Array<ReportStatus | "all"> = ["all", "pending", "processing", "resolved", "rejected"];
const withdrawFilters: Array<WithdrawStatus | "all"> = ["all", "pending", "approved", "paid", "rejected", "cancelled"];

type FinanceStats = {
  user_total_balance: number;
  escort_total_income: number;
  platform_total_fee: number;
  pending_withdraw_amount: number;
  paid_withdraw_amount: number;
  today_deal_amount: number;
  today_platform_fee: number;
  today_escort_income: number;
};

function formatTags(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join("、");
  if (typeof value === "string") return value.trim();
  return "";
}

export function AdminClientPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<EscortApplication[]>([]);
  const [escorts, setEscorts] = useState<Escort[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [withdraws, setWithdraws] = useState<Withdraw[]>([]);
  const [finance, setFinance] = useState<FinanceStats | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [withdrawNotes, setWithdrawNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingAction, setReviewingAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | "all">("all");
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | "all">("all");
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState<WithdrawStatus | "all">("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingReviewId, setUpdatingReviewId] = useState<string | null>(null);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [updatingWithdrawId, setUpdatingWithdrawId] = useState<string | null>(null);

  const activeEscorts = useMemo(() => escorts.filter((item) => item.status === "active" || item.approved), [escorts]);
  const completedOrders = useMemo(() => orders.filter((item) => item.status === "completed"), [orders]);
  const runningOrders = useMemo(() => orders.filter((item) => item.status === "accepted" || item.status === "in_progress" || item.status === "pending_confirm"), [orders]);
  const pendingReports = useMemo(() => reports.filter((item) => item.status === "pending" || item.status === "processing"), [reports]);

  async function getTokenOrShowMessage() {
    const token = await getCurrentAccessToken();
    if (!token) setMessage("请先登录管理员账号。");
    return token;
  }

  async function loadApplications() {
    const token = await getTokenOrShowMessage();
    if (!token) return;
    const response = await fetch("/api/admin/escort-applications", { headers: { Authorization: `Bearer ${token}` } });
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
    const response = await fetch(`/api/orders?scope=admin&status=${status}`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok) setOrders(result.data || []);
    else setMessage(result.error || "读取订单失败。");
  }

  async function loadReviews() {
    const token = await getTokenOrShowMessage();
    if (!token) return;
    const response = await fetch("/api/reviews?scope=admin", { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok) setReviews(result.data || []);
    else setMessage(result.error || "读取评价失败。");
  }

  async function loadReports(status: ReportStatus | "all" = reportStatusFilter) {
    const token = await getTokenOrShowMessage();
    if (!token) return;
    const response = await fetch(`/api/reports?scope=admin&status=${status}`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok) setReports(result.data || []);
    else setMessage(result.error || "读取举报失败。");
  }

  async function loadWithdraws(status: WithdrawStatus | "all" = withdrawStatusFilter) {
    const token = await getTokenOrShowMessage();
    if (!token) return;
    const response = await fetch(`/api/admin/withdraws?status=${status}`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok) setWithdraws(result.data || []);
    else setMessage(result.error || "读取提现失败。");
  }

  async function loadFinance() {
    const token = await getTokenOrShowMessage();
    if (!token) return;
    const response = await fetch("/api/admin/finance", { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok) setFinance(result.data);
    else setMessage(result.error || "读取财务统计失败。");
  }

  async function loadAll() {
    setIsLoading(true);
    await Promise.all([loadApplications(), loadOrders(), loadReviews(), loadReports(), loadWithdraws(), loadFinance()]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: applicationId, action, reject_reason: rejectReason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "审核失败。");
      router.push(`/admin/review-success?type=${action === "approve" ? "approved" : "rejected"}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "审核失败。");
      setReviewingAction(null);
    }
  }

  async function cancelOrder(orderId: string) {
    setMessage("");
    setUpdatingOrderId(orderId);
    const token = await getTokenOrShowMessage();
    if (!token) return setUpdatingOrderId(null);
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: orderId, action: "cancel", cancel_reason: "管理员取消异常订单" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "取消订单失败。");
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
    if (!token) return setUpdatingOrderId(null);
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: orderId, action: "dispute" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "标记申诉失败。");
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
    if (!token) return setUpdatingReviewId(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: review.id, hidden: !review.hidden }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "更新评价失败。");
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
    if (!token) return setUpdatingReportId(null);
    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: report.id, status, admin_note: reportNotes[report.id] || report.admin_note || "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "处理举报失败。");
      setMessage("举报处理状态已更新。");
      await loadReports();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "处理举报失败。");
    } finally {
      setUpdatingReportId(null);
    }
  }

  async function updateWithdraw(withdraw: Withdraw, action: "approve" | "paid" | "reject") {
    setMessage("");
    setUpdatingWithdrawId(withdraw.id);
    const token = await getTokenOrShowMessage();
    if (!token) return setUpdatingWithdrawId(null);
    const adminNote = withdrawNotes[withdraw.id]?.trim() || "";
    if (action === "reject" && adminNote.length < 2) {
      setMessage("拒绝提现必须填写原因。");
      setUpdatingWithdrawId(null);
      return;
    }
    try {
      const response = await fetch("/api/admin/withdraws", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: withdraw.id, action, admin_note: adminNote }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "处理提现失败。");
      setMessage("提现状态已更新。");
      await Promise.all([loadWithdraws(), loadFinance()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "处理提现失败。");
    } finally {
      setUpdatingWithdrawId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div>
        <p className="text-sm text-primary">管理后台</p>
        <h1 className="mt-2 text-3xl font-bold">运营与财务看板</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">查看订单、护航师、评价、举报、提现和平台资金状态。</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard title="用户总余额" value={formatMoney(finance?.user_total_balance || 0)} text="全站钱包可用余额" />
        <StatCard title="护航师总收入" value={formatMoney(finance?.escort_total_income || 0)} text="护航师累计收入" />
        <StatCard title="平台累计服务费" value={formatMoney(finance?.platform_total_fee || 0)} text="平台账本统计" />
        <StatCard title="待处理提现" value={formatMoney(finance?.pending_withdraw_amount || 0)} text="待审核或已通过" />
        <StatCard title="今日成交额" value={formatMoney(finance?.today_deal_amount || 0)} />
        <StatCard title="今日平台服务费" value={formatMoney(finance?.today_platform_fee || 0)} />
        <StatCard title="今日护航师收入" value={formatMoney(finance?.today_escort_income || 0)} />
        <StatCard title="已打款提现" value={formatMoney(finance?.paid_withdraw_amount || 0)} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard title="总订单数" value={`${orders.length}`} />
        <StatCard title="已完成订单" value={`${completedOrders.length}`} />
        <StatCard title="进行中订单" value={`${runningOrders.length}`} />
        <StatCard title="待处理申诉" value={`${pendingReports.length}`} />
        <StatCard title="Active 护航师" value={`${activeEscorts.length}`} />
      </div>

      {message ? <p className="mt-6 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
      {isLoading ? <p className="mt-6 text-sm text-muted-foreground">正在加载后台数据...</p> : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>提现管理</CardTitle>
          <CardDescription>通过、确认打款、拒绝提现都走服务端 API，并写入钱包流水。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FilterBar filters={withdrawFilters} current={withdrawStatusFilter} textMap={withdrawStatusText} onChange={async (status) => { setWithdrawStatusFilter(status); await loadWithdraws(status); }} />
          {withdraws.length === 0 ? <EmptyText>暂无提现记录。</EmptyText> : null}
          {withdraws.map((withdraw) => (
            <div key={withdraw.id} className="grid gap-4 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_320px]">
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{withdraw.id}</p>
                  <Badge tone={withdraw.status === "paid" ? "success" : withdraw.status === "rejected" ? "muted" : "warning"}>{withdrawStatusText[withdraw.status]}</Badge>
                </div>
                <p>用户：{withdraw.user_id}</p>
                <p>金额：{formatMoney(withdraw.amount)} / 方式：{withdraw.method || "未填写"}</p>
                <p>收款姓名：{withdraw.account_name || "未填写"} / 收款账号：{withdraw.account_no || "未填写"}</p>
                <p>备注：{withdraw.admin_note || withdraw.reject_reason || "暂无"}</p>
                <p>创建时间：{new Date(withdraw.created_at).toLocaleString("zh-CN")}</p>
              </div>
              <div className="grid gap-3">
                <Textarea
                  placeholder="拒绝时必须填写原因，也可作为审核备注"
                  value={withdrawNotes[withdraw.id] || ""}
                  onChange={(event) => setWithdrawNotes((current) => ({ ...current, [withdraw.id]: event.target.value }))}
                  maxLength={300}
                />
                {withdraw.status === "pending" ? (
                  <Button type="button" variant="outline" disabled={updatingWithdrawId === withdraw.id} onClick={() => updateWithdraw(withdraw, "approve")}>
                    通过提现
                  </Button>
                ) : null}
                {withdraw.status === "approved" ? (
                  <Button type="button" disabled={updatingWithdrawId === withdraw.id} onClick={() => updateWithdraw(withdraw, "paid")}>
                    确认打款
                  </Button>
                ) : null}
                {(withdraw.status === "pending" || withdraw.status === "approved") ? (
                  <Button type="button" variant="danger" disabled={updatingWithdrawId === withdraw.id} onClick={() => updateWithdraw(withdraw, "reject")}>
                    拒绝提现
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>护航师申请审核</CardTitle>
          <CardDescription>通过后同步用户身份和 escorts 资料；拒绝时需要填写原因。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {applications.length === 0 ? <EmptyText>暂无护航师申请。</EmptyText> : null}
          {applications.map((application) => (
            <div key={application.id} className="grid gap-4 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{application.nickname}</p>
                  <Badge tone={application.status === "approved" ? "success" : application.status === "pending" ? "warning" : "muted"}>{applicationStatusText[application.status]}</Badge>
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
              </div>
              <div className="grid gap-3">
                <Textarea
                  placeholder="拒绝时填写原因"
                  value={rejectReasons[application.id] || ""}
                  onChange={(event) => setRejectReasons((current) => ({ ...current, [application.id]: event.target.value }))}
                  disabled={application.status !== "pending" || Boolean(reviewingAction)}
                />
                <Button type="button" variant="outline" disabled={application.status !== "pending" || Boolean(reviewingAction)} onClick={() => handleApplicationReview(application.id, "approve")}>
                  通过申请
                </Button>
                <Button type="button" variant="danger" disabled={application.status !== "pending" || Boolean(reviewingAction)} onClick={() => handleApplicationReview(application.id, "reject")}>
                  拒绝申请
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>订单管理</CardTitle>
          <CardDescription>管理员可查看全部订单，取消异常订单，或标记申诉中。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FilterBar filters={orderFilters} current={orderStatusFilter} textMap={orderStatusText} onChange={async (status) => { setOrderStatusFilter(status); await loadOrders(status); }} />
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
              </div>
              <div className="flex flex-col gap-2">
                {order.status !== "completed" && order.status !== "cancelled" ? (
                  <Button type="button" variant="danger" disabled={updatingOrderId === order.id} onClick={() => cancelOrder(order.id)}>
                    取消异常订单
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
        </CardHeader>
        <CardContent className="grid gap-4">
          {reviews.length === 0 ? <EmptyText>暂无评价。</EmptyText> : null}
          {reviews.map((review) => (
            <div key={review.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{review.id}</p>
                <p>订单：{review.order_id} / 评分：{review.rating} 分</p>
                <p>内容：{review.content}</p>
              </div>
              <Button type="button" variant="outline" disabled={updatingReviewId === review.id} onClick={() => toggleReviewHidden(review)}>
                {review.hidden ? "恢复展示" : "隐藏评价"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>举报管理</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FilterBar filters={reportFilters} current={reportStatusFilter} textMap={reportStatusText} onChange={async (status) => { setReportStatusFilter(status); await loadReports(status); }} />
          {reports.length === 0 ? <EmptyText>暂无举报。</EmptyText> : null}
          {reports.map((report) => (
            <div key={report.id} className="grid gap-3 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_320px]">
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{report.id}</p>
                <p>状态：{reportStatusText[report.status]} / 类型：{report.type}</p>
                <p>原因：{report.reason}</p>
                <p>说明：{report.description}</p>
              </div>
              <div className="grid gap-3">
                <Textarea value={reportNotes[report.id] ?? report.admin_note ?? ""} onChange={(event) => setReportNotes((current) => ({ ...current, [report.id]: event.target.value }))} />
                <Button type="button" variant="outline" disabled={updatingReportId === report.id} onClick={() => updateReportStatus(report, "processing")}>标记处理中</Button>
                <Button type="button" variant="outline" disabled={updatingReportId === report.id} onClick={() => updateReportStatus(report, "resolved")}>标记已解决</Button>
                <Button type="button" variant="danger" disabled={updatingReportId === report.id} onClick={() => updateReportStatus(report, "rejected")}>驳回举报</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterBar<T extends string>({
  filters,
  current,
  textMap,
  onChange,
}: {
  filters: Array<T | "all">;
  current: T | "all";
  textMap: Record<T, string>;
  onChange: (value: T | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((status) => (
        <Button key={status} type="button" variant={current === status ? "default" : "outline"} onClick={() => onChange(status)}>
          {status === "all" ? "全部" : textMap[status]}
        </Button>
      ))}
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
