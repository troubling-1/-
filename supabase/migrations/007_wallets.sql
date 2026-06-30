create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  escort_id uuid references public.escorts(id) on delete set null,
  balance numeric(10,2) not null default 0,
  frozen_balance numeric(10,2) not null default 0,
  total_income numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallets
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists escort_id uuid references public.escorts(id) on delete set null,
  add column if not exists balance numeric(10,2) not null default 0,
  add column if not exists frozen_balance numeric(10,2) not null default 0,
  add column if not exists total_income numeric(10,2) not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.withdraws (
  id uuid primary key default gen_random_uuid(),
  escort_id uuid references public.escorts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  status text not null default 'pending',
  reject_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.withdraws
  add column if not exists escort_id uuid references public.escorts(id) on delete cascade,
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists amount numeric(10,2) not null default 0,
  add column if not exists status text not null default 'pending',
  add column if not exists reject_reason text,
  add column if not exists paid_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.withdraws
  drop constraint if exists withdraws_status_check,
  add constraint withdraws_status_check check (status in ('pending', 'approved', 'rejected', 'paid'));

create table if not exists public.order_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  operator_id uuid references public.users(id) on delete set null,
  from_status text,
  to_status text,
  action text not null default '',
  note text,
  created_at timestamptz not null default now()
);

alter table public.order_logs
  add column if not exists order_id uuid references public.orders(id) on delete cascade,
  add column if not exists operator_id uuid references public.users(id) on delete set null,
  add column if not exists from_status text,
  add column if not exists to_status text,
  add column if not exists action text not null default '',
  add column if not exists note text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_wallets_user_id_unique on public.wallets(user_id);
create index if not exists idx_wallets_escort_id on public.wallets(escort_id);
create index if not exists idx_withdraws_escort_id on public.withdraws(escort_id);
create index if not exists idx_withdraws_user_id on public.withdraws(user_id);
create index if not exists idx_withdraws_status on public.withdraws(status);
create index if not exists idx_order_logs_order_id on public.order_logs(order_id);
create index if not exists idx_messages_pair on public.messages(sender_id, receiver_id, created_at);

drop trigger if exists touch_wallets_updated_at on public.wallets;
create trigger touch_wallets_updated_at
before update on public.wallets
for each row execute function public.touch_updated_at();

drop trigger if exists touch_withdraws_updated_at on public.withdraws;
create trigger touch_withdraws_updated_at
before update on public.withdraws
for each row execute function public.touch_updated_at();

alter table public.wallets enable row level security;
alter table public.withdraws enable row level security;
alter table public.order_logs enable row level security;
alter table public.messages enable row level security;

drop policy if exists "users can read own wallet" on public.wallets;
create policy "users can read own wallet"
on public.wallets
for select
to authenticated
using (public.wallets.user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "admins can manage wallets" on public.wallets;
create policy "admins can manage wallets"
on public.wallets
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "withdraw visible to owner and admin" on public.withdraws;
create policy "withdraw visible to owner and admin"
on public.withdraws
for select
to authenticated
using (
  public.withdraws.user_id = (select auth.uid())
  or exists (
    select 1
    from public.escorts e
    where e.id = public.withdraws.escort_id
      and e.user_id = (select auth.uid())
  )
  or public.is_admin()
);

drop policy if exists "escorts can create withdraw" on public.withdraws;
create policy "escorts can create withdraw"
on public.withdraws
for insert
to authenticated
with check (
  public.withdraws.user_id = (select auth.uid())
  or exists (
    select 1
    from public.escorts e
    where e.id = public.withdraws.escort_id
      and e.user_id = (select auth.uid())
      and e.status = 'active'
  )
);

drop policy if exists "admin can update withdraw" on public.withdraws;
create policy "admin can update withdraw"
on public.withdraws
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order logs visible to participants and admin" on public.order_logs;
create policy "order logs visible to participants and admin"
on public.order_logs
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = public.order_logs.order_id
      and (
        o.customer_id = (select auth.uid())
        or o.user_id = (select auth.uid())
        or o.escort_user_id = (select auth.uid())
      )
  )
);

drop policy if exists "admins can insert order logs" on public.order_logs;
create policy "admins can insert order logs"
on public.order_logs
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "chat members can read messages" on public.messages;
create policy "chat members can read messages"
on public.messages
for select
to authenticated
using (
  public.messages.sender_id = (select auth.uid())
  or public.messages.receiver_id = (select auth.uid())
  or public.is_admin()
);

drop policy if exists "users can send messages" on public.messages;
create policy "users can send messages"
on public.messages
for insert
to authenticated
with check (public.messages.sender_id = (select auth.uid()));

grant select, insert, update on public.wallets to authenticated;
grant select, insert, update on public.withdraws to authenticated;
grant select, insert on public.order_logs to authenticated;
grant select, insert on public.messages to authenticated;
