import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-black/30 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";
