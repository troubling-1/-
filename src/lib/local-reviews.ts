"use client";

import { reviews as mockReviews } from "@/lib/mock-data";
import type { Review } from "@/lib/types";

const reviewsKey = "delta_escort_reviews";

export type CreateReviewInput = {
  order_id: string;
  user_id: string;
  escort_id: string;
  rating: number;
  content: string;
};

function readReviews(): Review[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(reviewsKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews: Review[]) {
  window.localStorage.setItem(reviewsKey, JSON.stringify(reviews));
  window.dispatchEvent(new Event("delta-escort-reviews-change"));
}

export function getLocalReviews() {
  return [...readReviews(), ...mockReviews];
}

export function getLocalReviewByOrderId(orderId: string) {
  return getLocalReviews().find((review) => review.order_id === orderId) || null;
}

export function createLocalReview(input: CreateReviewInput) {
  const rating = Number(input.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("评分必须是 1 到 5 分");
  }

  const content = input.content.trim();
  if (content.length < 2 || content.length > 300) {
    throw new Error("评价内容需要填写 2 到 300 个字");
  }

  const storedReviews = readReviews();
  const existingReview = storedReviews.find((review) => review.order_id === input.order_id);
  if (existingReview) {
    throw new Error("该订单已经评价过");
  }

  const newReview: Review = {
    id: `review-${Date.now()}`,
    order_id: input.order_id,
    user_id: input.user_id,
    escort_id: input.escort_id,
    rating,
    content,
    created_at: new Date().toISOString(),
  };

  saveReviews([newReview, ...storedReviews]);
  return newReview;
}
