export type UserRole = "customer" | "escort" | "admin";

export type UserStatus = "active" | "banned";

export type EscortApplicationStatus = "pending" | "approved" | "rejected";

export type EscortStatus = "active" | "disabled" | "pending";

export type OrderStatus =
  | "pending_payment"
  | "pending"
  | "accepted"
  | "in_progress"
  | "pending_confirm"
  | "completed"
  | "cancelled"
  | "disputed";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type WithdrawStatus = "pending" | "approved" | "rejected" | "paid";

export type ServiceType =
  | "fun_play"
  | "rank_boost"
  | "rank_coach"
  | "evacuation"
  | "materials"
  | "task"
  | "dungeon"
  | "newbie"
  | "voice"
  | "custom"
  | "escort"
  | "rank"
  | "fun";

export type ReportStatus = "pending" | "processing" | "resolved" | "rejected";

export type ReportType = "no_show" | "bad_attitude" | "private_trade" | "fraud" | "abuse" | "other";

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
  application_id?: string | null;
  nickname: string;
  avatar: string | null;
  game_id?: string | null;
  contact_wechat?: string | null;
  contact_qq?: string | null;
  rank: string;
  kd: number;
  good_at_modes?: string[];
  good_at_maps?: string[];
  price: number;
  intro?: string | null;
  status?: EscortStatus;
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
  updated_at?: string | null;
};

export type Order = {
  id: string;
  order_no?: string | null;
  customer_id?: string | null;
  user_id: string;
  escort_id?: string | null;
  escort_user_id?: string | null;
  game_name?: string | null;
  service_type: ServiceType;
  game_mode?: string | null;
  server_region?: string | null;
  start_time?: string | null;
  duration_hours?: number | null;
  requirement?: string | null;
  contact_phone?: string | null;
  price: number;
  platform_fee?: number | null;
  escort_income?: number | null;
  payment_status?: PaymentStatus | null;
  status: OrderStatus;
  contact_wechat?: string | null;
  contact_qq?: string | null;
  remark: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  paid_at?: string | null;
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  confirmed_at?: string | null;
  updated_at?: string | null;
  appointment_time?: string | null;
  created_at: string;
  escorts?: Pick<Escort, "id" | "nickname" | "user_id" | "price"> | null;
  customer?: Pick<User, "id" | "nickname" | "email"> | null;
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
  tags?: string[];
  hidden?: boolean;
  created_at: string;
  updated_at?: string | null;
  users?: Pick<User, "id" | "nickname" | "email"> | null;
  escorts?: Pick<Escort, "id" | "nickname" | "user_id"> | null;
  orders?: Pick<Order, "id" | "status"> | null;
};

export type Report = {
  id: string;
  reporter_id: string;
  target_user_id: string | null;
  order_id: string | null;
  review_id: string | null;
  type: ReportType;
  reason: string;
  description: string;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Pick<User, "id" | "nickname" | "email"> | null;
  target_user?: Pick<User, "id" | "nickname" | "email"> | null;
  orders?: Pick<Order, "id" | "customer_id" | "user_id" | "escort_id" | "status"> | null;
  reviews?: Pick<Review, "id" | "rating" | "content" | "hidden"> | null;
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
