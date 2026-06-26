"use client";

import { useEffect, useMemo, useState } from "react";

const stats = [
  { label: "累计护航订单", value: 1286 },
  { label: "平均评分", value: 98 },
  { label: "在线护航师", value: 36 },
];

const testimonials = [
  "撤离路线判断很稳，物资局压力小很多。",
  "护航师会提前确认需求，沟通效率高。",
  "订单状态清楚，取消和评价流程都很直观。",
];

export function HomeLivePanel() {
  const [progress, setProgress] = useState(0);
  const [activeReview, setActiveReview] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(1), 200);
    const reviewTimer = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % testimonials.length);
    }, 3200);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(reviewTimer);
    };
  }, []);

  const visibleStats = useMemo(
    () =>
      stats.map((item) => ({
        ...item,
        currentValue: Math.round(item.value * progress),
      })),
    [progress],
  );

  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-3">
      {visibleStats.map((item) => (
        <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
          <p className="text-2xl font-black text-[#e1c47d]">
            {item.currentValue}
            {item.label === "平均评分" ? "%" : "+"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
        </div>
      ))}
      <div className="rounded-md border border-[#c8a45d]/20 bg-black/35 p-4 backdrop-blur-xl sm:col-span-3">
        <p className="text-xs text-[#e1c47d]">用户评价轮播</p>
        <p className="mt-2 min-h-6 text-sm text-zinc-300">{testimonials[activeReview]}</p>
      </div>
    </div>
  );
}
