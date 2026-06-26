"use client";

export type ReportTargetType = "order" | "escort";
export type ReportStatus = "pending" | "resolved" | "rejected";

export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  detail: string;
  status: ReportStatus;
  created_at: string;
};

export type CreateReportInput = {
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  detail: string;
};

const reportsKey = "delta_escort_reports";

function readReports(): Report[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(reportsKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function saveReports(reports: Report[]) {
  window.localStorage.setItem(reportsKey, JSON.stringify(reports));
  window.dispatchEvent(new Event("delta-escort-reports-change"));
}

export function getLocalReports() {
  return readReports();
}

export function createLocalReport(input: CreateReportInput) {
  const reason = input.reason.trim();
  const detail = input.detail.trim();

  if (!input.reporter_id) {
    throw new Error("请先登录后再举报");
  }

  if (input.target_type !== "order" && input.target_type !== "escort") {
    throw new Error("举报对象类型不正确");
  }

  if (!input.target_id) {
    throw new Error("举报对象不能为空");
  }

  if (reason.length < 2 || reason.length > 50) {
    throw new Error("举报原因需要填写 2 到 50 个字");
  }

  if (detail.length < 5 || detail.length > 500) {
    throw new Error("举报说明需要填写 5 到 500 个字");
  }

  const newReport: Report = {
    id: `report-${Date.now()}`,
    reporter_id: input.reporter_id,
    target_type: input.target_type,
    target_id: input.target_id,
    reason,
    detail,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  saveReports([newReport, ...readReports()]);
  return newReport;
}

export function updateLocalReportStatus(reportId: string, status: ReportStatus) {
  const nextReports = readReports().map((report) => (report.id === reportId ? { ...report, status } : report));
  saveReports(nextReports);
}
