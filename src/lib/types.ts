export type UserRole = "customer" | "escort" | "admin";

export type UserStatus = "active" | "banned";

export type EscortApplicationStatus = "pending" | "approved" | "rejected";

export type OrderStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

export type WithdrawStatus = "pending" | "approved" | "rejected" | "paid";

export type ServiceType = "escort" | "evacuation" | "materials" | "rank" | "fun";

export type User = {
  id: string;
  email?: string | null;
  nickname: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  created_at: string;
};

export type EscortApplication = {
  id: string;
  user_id: string;
  nickname: string;
  game_id: string;
  contact_wechat: string | null;
  contact_qq: string | null;
  rank: string;
  kd: number;
  good_at_modes: string[];
  good_at_maps: string[];
  price: number;
  intro: string;
  status: EscortApplicationStatus;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
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
  verified?: boolean;
  order_count?: number;
  positive_rate?: number;
  response_time?: string;
  last_active_at?: string;
  special_modes?: string[];
  special_maps?: string[];
  special_playstyles?: string[];
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
