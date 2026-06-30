create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists order_no text,
  add column if not exists customer_id uuid,
  add column if not exists user_id uuid,
  add column if not exists escort_id uuid,
  add column if not exists escort_user_id uuid,
  add column if not exists game_name text,
  add column if not exists service_type text not null default 'fun_play',
  add column if not exists game_mode text,
  add column if not exists server_region text,
  add column if not exists start_time timestamptz,
  add column if not exists appointment_time timestamptz,
  add column if not exists duration_hours numeric(8,2) not null default 1,
  add column if not exists requirement text,
  add column if not exists remark text,
  add column if not exists contact_wechat text,
  add column if not exists contact_qq text,
  add column if not exists contact_phone text,
  add column if not exists price numeric(10,2) not null default 0,
  add column if not exists platform_fee numeric(10,2) not null default 0,
  add column if not exists escort_income numeric(10,2) not null default 0,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists status text not null default 'pending_payment',
  add column if not exists cancel_reason text,
  add column if not exists paid_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_order_no_key'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders add constraint orders_order_no_key unique (order_no);
  end if;
end;
$$;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'pending_payment',
      'pending',
      'accepted',
      'in_progress',
      'pending_confirm',
      'completed',
      'cancelled',
      'disputed'
    )
  );

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check check (payment_status in ('unpaid', 'paid', 'refunded'));

alter table public.orders
  drop constraint if exists orders_service_type_check;

alter table public.orders
  add constraint orders_service_type_check check (
    service_type in (
      'fun_play',
      'rank_boost',
      'rank_coach',
      'evacuation',
      'materials',
      'task',
      'dungeon',
      'newbie',
      'voice',
      'custom',
      'escort',
      'rank',
      'fun'
    )
  );

alter table public.orders
  alter column status set default 'pending_payment',
  alter column payment_status set default 'unpaid',
  alter column service_type set default 'fun_play',
  alter column duration_hours set default 1,
  alter column price set default 0,
  alter column platform_fee set default 0,
  alter column escort_income set default 0;

create or replace function public.generate_order_no()
returns text
language plpgsql
as $$
declare
  next_no text;
begin
  loop
    next_no := 'DE' || to_char(now(), 'YYYYMMDD') || lpad(floor(random() * 1000000)::text, 6, '0');
    exit when not exists (select 1 from public.orders where order_no = next_no);
  end loop;

  return next_no;
end;
$$;

create or replace function public.sync_order_closure_columns()
returns trigger
language plpgsql
as $$
begin
  if new.order_no is null or length(trim(new.order_no)) = 0 then
    new.order_no = public.generate_order_no();
  end if;

  if new.customer_id is null and new.user_id is not null then
    new.customer_id = new.user_id;
  end if;

  if new.user_id is null and new.customer_id is not null then
    new.user_id = new.customer_id;
  end if;

  if new.requirement is null and new.remark is not null then
    new.requirement = new.remark;
  end if;

  if new.remark is null and new.requirement is not null then
    new.remark = new.requirement;
  end if;

  if new.escort_user_id is null and new.escort_id is not null then
    select e.user_id
    into new.escort_user_id
    from public.escorts e
    where e.id = new.escort_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_orders_compat_before_write on public.orders;
drop trigger if exists sync_order_closure_before_write on public.orders;
create trigger sync_order_closure_before_write
before insert or update on public.orders
for each row execute function public.sync_order_closure_columns();

drop trigger if exists touch_orders_updated_at on public.orders;
create trigger touch_orders_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

update public.orders
set
  order_no = coalesce(order_no, public.generate_order_no()),
  payment_status = case when status in ('pending', 'accepted', 'in_progress', 'pending_confirm', 'completed') then 'paid' else payment_status end,
  status = case when status = 'completed' then 'completed' when status = 'cancelled' then 'cancelled' else status end,
  start_time = coalesce(start_time, appointment_time, created_at),
  duration_hours = coalesce(duration_hours, 1),
  platform_fee = coalesce(platform_fee, round((price * 0.12)::numeric, 2)),
  escort_income = coalesce(escort_income, round((price - (price * 0.12))::numeric, 2));

update public.orders o
set escort_user_id = coalesce(o.escort_user_id, e.user_id)
from public.escorts e
where o.escort_id = e.id;

create index if not exists idx_orders_order_no on public.orders(order_no);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_escort_id on public.orders(escort_id);
create index if not exists idx_orders_escort_user_id on public.orders(escort_user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

alter table public.orders enable row level security;

drop policy if exists "orders visible to owner escort admin" on public.orders;
create policy "orders visible to owner escort admin"
on public.orders
for select
to authenticated
using (
  customer_id = (select auth.uid())
  or user_id = (select auth.uid())
  or escort_user_id = (select auth.uid())
  or exists (
    select 1
    from public.escorts e
    where e.id = public.orders.escort_id
      and e.user_id = (select auth.uid())
  )
  or public.is_admin()
);

drop policy if exists "customers can create orders" on public.orders;
create policy "customers can create orders"
on public.orders
for insert
to authenticated
with check (
  customer_id = (select auth.uid())
  or user_id = (select auth.uid())
);

drop policy if exists "escorts and admins can update orders" on public.orders;
drop policy if exists "orders server updates only" on public.orders;
create policy "orders server updates only"
on public.orders
for update
to service_role
using (true)
with check (true);

grant select, insert on public.orders to authenticated;
grant select, insert, update on public.orders to service_role;
