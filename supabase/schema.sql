create extension if not exists "pgcrypto";

create type user_role as enum ('customer', 'escort', 'admin');
create type order_status as enum ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
create type service_type as enum ('escort', 'evacuation', 'materials', 'rank', 'fun');
create type withdraw_status as enum ('pending', 'approved', 'rejected', 'paid');

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text not null check (char_length(nickname) between 1 and 30),
  avatar text,
  role user_role not null default 'customer',
  status text not null default 'active' check (status in ('active', 'banned')),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.escorts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  avatar text,
  rank text not null default '未填写',
  kd numeric(5,2) not null default 0 check (kd >= 0),
  price numeric(10,2) not null check (price >= 0),
  bio text not null default '',
  online_status boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  escort_id uuid not null references public.escorts(id) on delete restrict,
  service_type service_type not null,
  price numeric(10,2) not null check (price >= 0),
  status order_status not null default 'pending',
  remark text,
  appointment_time timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  escort_id uuid not null references public.escorts(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  unique(order_id, user_id)
);

create table if not exists public.withdraws (
  id uuid primary key default gen_random_uuid(),
  escort_id uuid not null references public.escorts(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  status withdraw_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_escorts_approved_online on public.escorts(approved, online_status);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_escort_id on public.orders(escort_id);
create index if not exists idx_messages_pair on public.messages(sender_id, receiver_id, created_at);
create index if not exists idx_reviews_escort_id on public.reviews(escort_id);

alter table public.users enable row level security;
alter table public.escorts enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.withdraws enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "users can read own profile"
on public.users for select
using (id = auth.uid() or public.is_admin());

create policy "users can update own profile"
on public.users for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "public can read approved escorts"
on public.escorts for select
using (approved = true or user_id = auth.uid() or public.is_admin());

create policy "users can apply escort"
on public.escorts for insert
with check (user_id = auth.uid());

create policy "escorts can update own profile"
on public.escorts for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "orders visible to owner escort admin"
on public.orders for select
using (
  user_id = auth.uid()
  or exists (select 1 from public.escorts where escorts.id = orders.escort_id and escorts.user_id = auth.uid())
  or public.is_admin()
);

create policy "customers can create orders"
on public.orders for insert
with check (user_id = auth.uid() or user_id is null);

create policy "escorts and admins can update orders"
on public.orders for update
using (
  exists (select 1 from public.escorts where escorts.id = orders.escort_id and escorts.user_id = auth.uid())
  or public.is_admin()
);

create policy "chat members can read messages"
on public.messages for select
using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());

create policy "users can send messages"
on public.messages for insert
with check (sender_id = auth.uid());

create policy "reviews visible to everyone"
on public.reviews for select
using (true);

create policy "customers can create own reviews"
on public.reviews for insert
with check (user_id = auth.uid());

create policy "withdraw visible to owner and admin"
on public.withdraws for select
using (
  exists (select 1 from public.escorts where escorts.id = withdraws.escort_id and escorts.user_id = auth.uid())
  or public.is_admin()
);

create policy "escorts can create withdraw"
on public.withdraws for insert
with check (
  exists (select 1 from public.escorts where escorts.id = withdraws.escort_id and escorts.user_id = auth.uid())
);

create policy "admin can update withdraw"
on public.withdraws for update
using (public.is_admin());

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, nickname, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
