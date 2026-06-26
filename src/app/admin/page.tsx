"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/site/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAccessToken } from "@/lib/auth-client";
import type { EscortApplication } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const statusText = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

export default function AdminPage() {
  return (
    <RoleGate allowedRoles={["admin"]}>
      <AdminContent />
    </RoleGate>
  );
}

function AdminContent() {
  const [applications, setApplications] = useState<EscortApplication[]>([]);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const pendingApplications = useMemo(() => applications.filter((item) => item.status === "pending"), [applications]);

  async function loadApplications() {
    setMessage("");
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录管理员账号。");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/admin/escort-applications", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

  useEffect(() => {
    loadApplications();
  }, []);

  async function handleReview(applicationId: string, action: "approve" | "reject") {
    setMessage("");
    const token = await getCurrentAccessToken();

    if (!token) {
      setMessage("请先登录管理员账号。");
      return;
    }

    const rejectReason = rejectReasons[applicationId]?.trim() || "";

    if (action === "reject" && rejectReason.length < 2) {
      setMessage("拒绝申请时需要填写至少 2 个字的原因。");
      return;
    }

    const response = await fetch("/api/admin/escort-applications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: applicationId,
        action,
        reject_reason: rejectReason,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "审核失败。");
      return;
    }

    setMessage(action === "approve" ? "已通过申请，用户角色已更新为护航师。" : "已拒绝申请。");
    await loadApplications();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div>
        <p className="text-sm text-primary">管理后台</p>
        <h1 className="mt-2 text-3xl font-bold">护航师审核</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          只有管理员可以审核护航师入驻申请。通过后会更新用户角色为 escort，并创建或更新 escorts 资料。
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard title="全部申请" value={applications.length} />
        <StatCard title="待审核" value={pendingApplications.length} />
        <StatCard title="已通过" value={applications.filter((item) => item.status === "approved").length} />
      </div>

      {message ? <p className="mt-6 rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>申请列表</CardTitle>
          <CardDescription>优先处理待审核申请。拒绝时必须填写原因，用户可在个人中心查看。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isLoading ? <p className="text-sm text-muted-foreground">正在加载申请...</p> : null}
          {!isLoading && applications.length === 0 ? (
            <p className="rounded-md border border-border bg-black/30 p-4 text-sm text-muted-foreground">暂无护航师申请。</p>
          ) : null}

          {applications.map((application) => (
            <div key={application.id} className="grid gap-4 rounded-md border border-border bg-black/30 p-4 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{application.nickname}</p>
                  <Badge tone={application.status === "approved" ? "success" : application.status === "pending" ? "warning" : "muted"}>
                    {statusText[application.status]}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <p>游戏 ID：{application.game_id}</p>
                  <p>段位：{application.rank}</p>
                  <p>KD：{application.kd}</p>
                  <p>价格：{formatMoney(application.price)}/局</p>
                  <p>微信：{application.contact_wechat || "未填写"}</p>
                  <p>QQ：{application.contact_qq || "未填写"}</p>
                  <p>擅长模式：{application.good_at_modes.join("，") || "未填写"}</p>
                  <p>擅长地图：{application.good_at_maps.join("，") || "未填写"}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">简介：{application.intro}</p>
                {application.reject_reason ? <p className="mt-2 text-sm text-destructive">拒绝原因：{application.reject_reason}</p> : null}
              </div>

              <div className="grid gap-3">
                <Textarea
                  placeholder="拒绝时填写原因，例如：资料不完整，请补充游戏 ID 和在线时间。"
                  value={rejectReasons[application.id] || ""}
                  onChange={(event) => setRejectReasons((current) => ({ ...current, [application.id]: event.target.value }))}
                  disabled={application.status !== "pending"}
                />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={application.status !== "pending"}
                    onClick={() => handleReview(application.id, "approve")}
                  >
                    通过申请
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={application.status !== "pending"}
                    onClick={() => handleReview(application.id, "reject")}
                  >
                    拒绝申请
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

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
