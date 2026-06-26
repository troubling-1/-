"use client";

import { saveLocalSession } from "@/lib/local-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { User as AppUser } from "@/lib/types";

export type AuthSessionState = {
  profile: AppUser | null;
  accessToken: string | null;
};

export function getRoleHomePath(role: AppUser["role"]) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "escort") {
    return "/escort/dashboard";
  }

  return "/center";
}

export async function getCurrentAccessToken() {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.access_token) {
    return null;
  }

  return data.session.access_token;
}

export async function fetchAuthProfile() {
  const token = await getCurrentAccessToken();

  if (!token) {
    return null;
  }

  const response = await fetch("/api/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error((await response.json()).error || "读取账号角色失败。");
  }

  const result = (await response.json()) as { data: AppUser };
  const profile = result.data;

  saveLocalSession({
    id: profile.id,
    email: "",
    nickname: profile.nickname,
    role: profile.role,
    status: profile.status,
    created_at: profile.created_at,
  });

  return profile;
}

export async function getAuthSessionState(): Promise<AuthSessionState> {
  const accessToken = await getCurrentAccessToken();

  if (!accessToken) {
    return { profile: null, accessToken: null };
  }

  const profile = await fetchAuthProfile();
  return { profile, accessToken };
}
