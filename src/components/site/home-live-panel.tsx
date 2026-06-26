"use client";

import { useEffect, useMemo, useState } from "react";

const stats = [
  { label: "累计完成订单", value: 1286, suffix: "+" },
  { label: "认证护航师", value: 36, suffix: "位" },
  { label: "平均响应", value: 3, suffix: "分钟" },
  { label: "用户满意度", value: 98, suffix: "%" },
];

const reviews = [
  "第一次下单带撤离，客服先确认需求，护航师路线很稳，物资安全带出。",
  "物资护送没有催着打架，先看背包价值再规划路线，体验比自己组野队好很多。",
  "下单后客服提醒不要私下转账，订单状态也能查，比较放心。",
];

export function HomeLivePanel() {
  const [progress, setProgress] = useState(0);
  const [activeReview, setActiveReview] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(1), 200);
    const reviewTimer = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % reviews.length);
    }, 3600);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(reviewTimer);
    };
  }, []);

  const visibleStats = useMemo(
    () =>
      stats.map((item) => ({
        ...item,
        currentValue: Math.max(1, Math.round(item.value * progress)),
      })),
    [progress],
  );

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {visibleStats.map((item) => (
        <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
          <p className="text-2xl font-black text-[#e1c47d]">
            {item.currentValue}
            {item.suffix}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
        </div>
      ))}
      <div className="rounded-md border border-[#c8a45d]/20 bg-black/35 p-4 backdrop-blur-xl sm:col-span-2 lg:col-span-4">
        <p className="text-xs text-[#e1c47d]">真实用户反馈</p>
        <p className="mt-2 min-h-10 text-sm leading-6 text-zinc-300">{reviews[activeReview]}</p>
      </div>
    </div>
  );
}
