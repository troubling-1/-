"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAuthProfile, getRoleHomePath } from "@/lib/auth-client";
import { createBrowserSupabaseClient, getBrowserSupabaseConfigError } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setMessage("邮箱和密码不能为空。");
      return;
    }

    if (password.length < 6) {
      setMessage("密码至少 6 位。");
      return;
    }

    const configError = getBrowserSupabaseConfigError();
    if (configError) {
      setMessage(`${configError} 当前不会发起 Supabase 注册请求。`);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(error.message || "注册失败，请稍后重试。");
        return;
      }

      if (data.session) {
        const profile = await fetchAuthProfile();
        setMessage("注册成功。");
        router.push(profile ? getRoleHomePath(profile.role) : "/center");
        router.refresh();
        return;
      }

      setMessage("注册成功，请按 Supabase 邮件配置完成验证后再登录。");
      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "注册失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>注册</CardTitle>
          <CardDescription>注册默认是普通玩家账号，不提供管理员注册入口。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleRegister}>
            <Input name="email" type="email" placeholder="邮箱" autoComplete="email" />
            <Input name="password" type="password" placeholder="密码，至少 6 位" autoComplete="new-password" />
            {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "注册中..." : "注册"}
            </Button>
            <Link className="text-sm text-primary" href="/login">
              已有账号？去登录
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
