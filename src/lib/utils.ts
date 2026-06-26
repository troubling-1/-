import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "¥0";
  }

  return `¥${value.toFixed(0)}`;
}

export function isConfiguredSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
