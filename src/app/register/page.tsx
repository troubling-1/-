"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerLocalUser } from "@/lib/local-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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
      setMessage("邮箱和密码不能为空");
      return;
    }

    if (password.length < 6) {
      setMessage("密码至少 6 位");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("注册成功，请按 Supabase 邮件配置完成验证");
      router.push("/login");
    } catch {
      try {
        registerLocalUser(email, password);
        setMessage("本地注册成功，已自动登录");
        router.push("/user");
        router.refresh();
      } catch (localError) {
        setMessage(localError instanceof Error ? localError.message : "注册失败");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>注册</CardTitle>
          <CardDescription>创建普通玩家账号，后续可以申请成为护航师。</CardDescription>
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
