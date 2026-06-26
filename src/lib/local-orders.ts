"use client";

import { orders as mockOrders } from "@/lib/mock-data";
import type { Order, OrderStatus, ServiceType } from "@/lib/types";

const ordersKey = "delta_escort_mock_orders";

export type CreateLocalOrderInput = {
  user_id: string;
  escort_id: string;
  service_type: ServiceType;
  price: number;
  remark: string;
  appointment_time: string;
};

function readStoredOrders(): Order[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ordersKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function saveStoredOrders(orders: Order[]) {
  window.localStorage.setItem(ordersKey, JSON.stringify(orders));
  window.dispatchEvent(new Event("delta-escort-orders-change"));
}

export function getLocalOrders() {
  const storedOrders = readStoredOrders();
  const storedOrderIds = new Set(storedOrders.map((order) => order.id));
  const visibleMockOrders = mockOrders.filter((order) => !storedOrderIds.has(order.id));

  return [...storedOrders, ...visibleMockOrders];
}

export function createLocalOrder(input: CreateLocalOrderInput) {
  const newOrder: Order = {
    id: `local-order-${Date.now()}`,
    user_id: input.user_id,
    escort_id: input.escort_id,
    service_type: input.service_type,
    price: input.price,
    status: "pending",
    remark: input.remark,
    appointment_time: input.appointment_time,
    created_at: new Date().toISOString(),
  };

  saveStoredOrders([newOrder, ...readStoredOrders()]);
  return newOrder;
}

export function updateLocalOrderStatus(orderId: string, status: OrderStatus, cancelReason?: string) {
  const storedOrders = readStoredOrders();
  const existingStoredOrder = storedOrders.find((order) => order.id === orderId);
  const cancelledAt = status === "cancelled" ? new Date().toISOString() : null;

  if (!existingStoredOrder) {
    const mockOrder = mockOrders.find((order) => order.id === orderId);
    if (!mockOrder) {
      return;
    }

    saveStoredOrders([
      {
        ...mockOrder,
        status,
        cancel_reason: status === "cancelled" ? cancelReason || "用户取消订单" : null,
        cancelled_at: cancelledAt,
      },
      ...storedOrders,
    ]);
    return;
  }

  const nextOrders = storedOrders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
          cancel_reason: status === "cancelled" ? cancelReason || "用户取消订单" : null,
          cancelled_at: cancelledAt,
        }
      : order,
  );
  saveStoredOrders(nextOrders);
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  if (status === "pending") {
    return "accepted";
  }

  if (status === "accepted") {
    return "in_progress";
  }

  if (status === "in_progress") {
    return "completed";
  }

  return null;
}
