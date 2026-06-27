alter table public.reviews
  add column if not exists tags text[] not null default '{}',
  add column if not exists hidden boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_reviews_order_user_unique on public.reviews(order_id, user_id);
create index if not exists idx_reviews_hidden on public.reviews(hidden);

drop trigger if exists touch_reviews_updated_at on public.reviews;
create trigger touch_reviews_updated_at
before update on public.reviews
for each row execute function public.touch_updated_at();

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  review_id uuid references public.reviews(id) on delete set null,
  type text not null,
  reason text not null,
  description text not null,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_type_check check (type in ('no_show', 'bad_attitude', 'private_trade', 'fraud', 'abuse', 'other')),
  constraint reports_status_check check (status in ('pending', 'processing', 'resolved', 'rejected'))
);

create index if not exists idx_reports_reporter_id on public.reports(reporter_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_order_id on public.reports(order_id);
create index if not exists idx_reports_review_id on public.reports(review_id);

drop trigger if exists touch_reports_updated_at on public.reports;
create trigger touch_reports_updated_at
before update on public.reports
for each row execute function public.touch_updated_at();

alter table public.reviews enable row level security;
alter table public.reports enable row level security;

drop policy if exists "reviews visible to everyone" on public.reviews;
create policy "reviews visible to everyone"
on public.reviews for select
using (hidden = false or public.is_admin());

drop policy if exists "customers can create own reviews" on public.reviews;
create policy "customers can create own reviews"
on public.reviews for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.orders
    left join public.escorts on escorts.id = orders.escort_id
    where orders.id = reviews.order_id
      and orders.status = 'completed'
      and coalesce(orders.customer_id, orders.user_id) = auth.uid()
      and escorts.user_id <> auth.uid()
  )
);

drop policy if exists "admins can update reviews" on public.reviews;
create policy "admins can update reviews"
on public.reviews for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read own reports" on public.reports;
create policy "users can read own reports"
on public.reports for select
using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "users can create own reports" on public.reports;
create policy "users can create own reports"
on public.reports for insert
with check (reporter_id = auth.uid());

drop policy if exists "admins can update reports" on public.reports;
create policy "admins can update reports"
on public.reports for update
using (public.is_admin())
with check (public.is_admin());
