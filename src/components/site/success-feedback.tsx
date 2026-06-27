import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, Circle, Headphones, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusItem = {
  label: string;
  value: string;
};

type StepItem = {
  label: string;
  state: "done" | "current" | "pending";
};

type ActionItem = {
  label: string;
  href: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "danger";
};

type SuccessFeedbackProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "success" | "danger";
  statusItems?: StatusItem[];
  steps?: StepItem[];
  actions: ActionItem[];
  children?: ReactNode;
};

export function SuccessFeedback({ eyebrow, title, description, tone = "success", statusItems = [], steps = [], actions, children }: SuccessFeedbackProps) {
  const isSuccess = tone === "success";

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#050907] px-4 py-10 text-foreground sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.18),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.2),rgba(0,0,0,0.75))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

      <section className="relative mx-auto grid max-w-5xl gap-6">
        <div className="rounded-lg border border-emerald-300/20 bg-white/[0.04] p-6 shadow-[0_0_45px_rgba(16,185,129,0.12)] backdrop-blur-md sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={cn("text-sm font-medium", isSuccess ? "text-emerald-300" : "text-red-300")}>{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
            </div>
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-md border",
                isSuccess ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-300" : "border-red-300/40 bg-red-300/10 text-red-300",
              )}
            >
              {isSuccess ? <ShieldCheck className="h-7 w-7" aria-hidden="true" /> : <Circle className="h-7 w-7" aria-hidden="true" />}
            </div>
          </div>

          {statusItems.length ? (
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {statusItems.map((item) => (
                <div key={item.label} className="rounded-md border border-white/10 bg-black/25 p-4">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-2 font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {children ? <div className="mt-6">{children}</div> : null}

          {steps.length ? (
            <div className="mt-7 grid gap-3">
              {steps.map((step, index) => (
                <div key={step.label} className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-4">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      step.state === "done" && "border-emerald-300 bg-emerald-300 text-black",
                      step.state === "current" && "border-emerald-300/60 bg-emerald-300/10 text-emerald-200",
                      step.state === "pending" && "border-white/20 bg-white/5 text-muted-foreground",
                    )}
                  >
                    {step.state === "done" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{step.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {step.state === "done" ? "已完成" : step.state === "current" ? "进行中" : "未开始"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {actions.map((action) => (
              <Button key={action.label} asChild variant={action.variant || "default"} className="min-h-11">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-300/10 bg-white/[0.03] p-4 text-sm text-muted-foreground backdrop-blur">
          <div className="flex gap-3">
            <Headphones className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            <p>如资料、订单或售后需要补充说明，平台客服会通过你提交的联系方式协助确认。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
