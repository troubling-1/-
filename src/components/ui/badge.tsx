import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "muted";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  const toneClass = {
    default: "border-primary/30 bg-primary/10 text-primary",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    muted: "border-border bg-muted text-muted-foreground",
  }[tone];

  return <span className={cn("inline-flex items-center rounded-sm border px-2 py-1 text-xs font-medium", toneClass, className)} {...props} />;
}
