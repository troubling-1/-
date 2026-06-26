"use client";

export type EscortApplicationStatus = "pending" | "approved" | "rejected";

export type EscortApplication = {
  id: string;
  user_id: string;
  nickname: string;
  rank: string;
  kd: number;
  price: number;
  bio: string;
  contact: string;
  status: EscortApplicationStatus;
  reject_reason: string | null;
  created_at: string;
};

export type CreateEscortApplicationInput = {
  user_id: string;
  nickname: string;
  rank: string;
  kd: number;
  price: number;
  bio: string;
  contact: string;
};

const applicationsKey = "delta_escort_applications";

function readApplications(): EscortApplication[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(applicationsKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function saveApplications(applications: EscortApplication[]) {
  window.localStorage.setItem(applicationsKey, JSON.stringify(applications));
  window.dispatchEvent(new Event("delta-escort-applications-change"));
}

export function getLocalEscortApplications() {
  return readApplications();
}

export function getLocalEscortApplicationByUserId(userId: string) {
  return readApplications().find((application) => application.user_id === userId) || null;
}

export function createLocalEscortApplication(input: CreateEscortApplicationInput) {
  const applications = readApplications();
  const existingApplication = applications.find((application) => application.user_id === input.user_id);

  if (existingApplication && existingApplication.status === "pending") {
    throw new Error("你已经提交过入驻申请，请等待管理员审核");
  }

  const nextApplications = applications.filter((application) => application.user_id !== input.user_id);
  const newApplication: EscortApplication = {
    id: `escort-application-${Date.now()}`,
    user_id: input.user_id,
    nickname: input.nickname,
    rank: input.rank,
    kd: input.kd,
    price: input.price,
    bio: input.bio,
    contact: input.contact,
    status: "pending",
    reject_reason: null,
    created_at: new Date().toISOString(),
  };

  saveApplications([newApplication, ...nextApplications]);
  return newApplication;
}

export function updateLocalEscortApplicationStatus(
  applicationId: string,
  status: EscortApplicationStatus,
  rejectReason: string | null = null,
) {
  const applications = readApplications();
  const nextApplications = applications.map((application) =>
    application.id === applicationId
      ? {
          ...application,
          status,
          reject_reason: status === "rejected" ? rejectReason || "资料不符合入驻要求" : null,
        }
      : application,
  );

  saveApplications(nextApplications);
}
