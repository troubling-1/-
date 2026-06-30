create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.users(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  escort_id uuid references public.escorts(id) on delete set null,
  escort_user_id uuid references public.users(id) on delete set null,
  service_type text not null default 'escort',
  game_mode text,
  requirement text,
  remark text,
  price numeric(10,2) not null default 0,
  status text not null default 'pending',
  contact_wechat text,
  contact_qq text,
  cancel_reason text,
  appointment_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

alter table public.orders
  add column if not exists customer_id uuid references public.users(id) on delete set null,
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists escort_id uuid references public.escorts(id) on delete set null,
  add column if not exists escort_user_id uuid references public.users(id) on delete set null,
  add column if not exists service_type text not null default 'escort',
  add column if not exists game_mode text,
  add column if not exists requirement text,
  add column if not exists remark text,
  add column if not exists price numeric(10,2) not null default 0,
  add column if not exists status text not null default 'pending',
  add column if not exists contact_wechat text,
  add column if not exists contact_qq text,
  add column if not exists cancel_reason text,
  add column if not exists appointment_time timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists accepted_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

alter table public.orders
  drop constraint if exists orders_status_check,
  add constraint orders_status_check check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled'));

alter table public.orders
  drop constraint if exists orders_service_type_check,
  add constraint orders_service_type_check check (service_type in ('escort', 'evacuation', 'materials', 'rank', 'fun'));

create or replace function public.sync_order_compat_columns()
returns trigger
language plpgsql
as $$
begin
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

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_escort_id on public.orders(escort_id);
create index if not exists idx_orders_escort_user_id on public.orders(escort_user_id);
create index if not exists idx_orders_status on public.orders(status);

drop trigger if exists sync_orders_compat_before_write on public.orders;
create trigger sync_orders_compat_before_write
before insert or update on public.orders
for each row execute function public.sync_order_compat_columns();

drop trigger if exists touch_orders_updated_at on public.orders;
create trigger touch_orders_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

update public.orders o
set
  customer_id = coalesce(o.customer_id, o.user_id),
  user_id = coalesce(o.user_id, o.customer_id),
  requirement = coalesce(o.requirement, o.remark),
  remark = coalesce(o.remark, o.requirement),
  escort_user_id = coalesce(o.escort_user_id, e.user_id)
from public.escorts e
where o.escort_id = e.id;

alter table public.orders enable row level security;

drop policy if exists "orders visible to owner escort admin" on public.orders;
create policy "orders visible to owner escort admin"
on public.orders
for select
to authenticated
using (
  public.orders.customer_id = (select auth.uid())
  or public.orders.user_id = (select auth.uid())
  or public.orders.escort_user_id = (select auth.uid())
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
  public.orders.customer_id = (select auth.uid())
  or public.orders.user_id = (select auth.uid())
);

drop policy if exists "escorts and admins can update orders" on public.orders;
create policy "escorts and admins can update orders"
on public.orders
for update
to authenticated
using (
  public.is_admin()
  or public.orders.escort_user_id = (select auth.uid())
  or exists (
    select 1
    from public.escorts e
    where e.id = public.orders.escort_id
      and e.user_id = (select auth.uid())
      and e.status = 'active'
  )
)
with check (
  public.is_admin()
  or public.orders.escort_user_id = (select auth.uid())
  or exists (
    select 1
    from public.escorts e
    where e.id = public.orders.escort_id
      and e.user_id = (select auth.uid())
      and e.status = 'active'
  )
);

grant select, insert, update on public.orders to authenticated;
