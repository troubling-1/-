alter table public.orders
  add column if not exists customer_id uuid references public.users(id) on delete set null,
  add column if not exists game_mode text,
  add column if not exists requirement text,
  add column if not exists contact_wechat text,
  add column if not exists contact_qq text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists accepted_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

update public.orders
set customer_id = user_id
where customer_id is null and user_id is not null;

update public.orders
set requirement = remark
where requirement is null and remark is not null;

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);

drop trigger if exists touch_orders_updated_at on public.orders;
create trigger touch_orders_updated_at
before update on public.orders
for each row execute procedure public.touch_updated_at();

drop policy if exists "orders visible to owner escort admin" on public.orders;
create policy "orders visible to owner escort admin"
on public.orders for select
using (
  customer_id = auth.uid()
  or user_id = auth.uid()
  or exists (select 1 from public.escorts where escorts.id = orders.escort_id and escorts.user_id = auth.uid())
  or public.is_admin()
);

drop policy if exists "customers can create orders" on public.orders;
create policy "customers can create orders"
on public.orders for insert
with check (customer_id = auth.uid() or user_id = auth.uid());
