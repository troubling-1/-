"use client";

import type { UserRole } from "@/lib/types";

const usersKey = "delta_escort_mock_users";
const sessionKey = "delta_escort_mock_session";

export type LocalAuthUser = {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
  created_at: string;
};

type StoredUser = LocalAuthUser & {
  password: string;
};

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(usersKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  window.localStorage.setItem(usersKey, JSON.stringify(users));
}

function saveSession(user: LocalAuthUser) {
  window.localStorage.setItem(sessionKey, JSON.stringify(user));
  window.dispatchEvent(new Event("delta-escort-auth-change"));
}

export function getLocalCurrentUser(): LocalAuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(sessionKey);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as LocalAuthUser;
  } catch {
    return null;
  }
}

export function registerLocalUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();
  const existingUser = users.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    throw new Error("该邮箱已注册，请直接登录");
  }

  const nickname = normalizedEmail.split("@")[0] || "玩家";
  const storedUser: StoredUser = {
    id: `local-${Date.now()}`,
    email: normalizedEmail,
    password,
    nickname,
    role: "player",
    created_at: new Date().toISOString(),
  };

  saveUsers([...users, storedUser]);

  const { password: _password, ...user } = storedUser;
  saveSession(user);
  return user;
}

export function loginLocalUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();
  const foundUser = users.find((user) => user.email === normalizedEmail && user.password === password);

  if (!foundUser) {
    throw new Error("邮箱或密码不正确");
  }

  const { password: _password, ...user } = foundUser;
  saveSession(user);
  return user;
}

export function logoutLocalUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(sessionKey);
  window.dispatchEvent(new Event("delta-escort-auth-change"));
}
