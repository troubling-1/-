export type UserRole = "player" | "escort" | "admin";

export type OrderStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

export type WithdrawStatus = "pending" | "approved" | "rejected" | "paid";

export type ServiceType = "escort" | "evacuation" | "materials" | "rank" | "fun";

export type User = {
  id: string;
  nickname: string;
  avatar: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
};

export type Escort = {
  id: string;
  user_id: string;
  nickname: string;
  avatar: string | null;
  rank: string;
  kd: number;
  price: number;
  bio: string;
  online_status: boolean;
  approved: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  escort_id: string;
  service_type: ServiceType;
  price: number;
  status: OrderStatus;
  remark: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  appointment_time?: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export type Review = {
  id: string;
  order_id: string;
  user_id: string;
  escort_id: string;
  rating: number;
  content: string;
  created_at: string;
};

export type Withdraw = {
  id: string;
  escort_id: string;
  amount: number;
  status: WithdrawStatus;
  created_at: string;
};

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
};
