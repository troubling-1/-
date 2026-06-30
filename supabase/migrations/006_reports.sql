create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  review_id uuid references public.reviews(id) on delete set null,
  type text not null default 'other',
  reason text not null default '',
  description text not null default '',
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports
  add column if not exists reporter_id uuid references public.users(id) on delete cascade,
  add column if not exists target_user_id uuid references public.users(id) on delete set null,
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists review_id uuid references public.reviews(id) on delete set null,
  add column if not exists type text not null default 'other',
  add column if not exists reason text not null default '',
  add column if not exists description text not null default '',
  add column if not exists status text not null default 'pending',
  add column if not exists admin_note text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.reports
  drop constraint if exists reports_type_check,
  add constraint reports_type_check check (type in ('no_show', 'bad_attitude', 'private_trade', 'fraud', 'abuse', 'other'));

alter table public.reports
  drop constraint if exists reports_status_check,
  add constraint reports_status_check check (status in ('pending', 'processing', 'resolved', 'rejected'));

create index if not exists idx_reports_reporter_id on public.reports(reporter_id);
create index if not exists idx_reports_target_user_id on public.reports(target_user_id);
create index if not exists idx_reports_order_id on public.reports(order_id);
create index if not exists idx_reports_review_id on public.reports(review_id);
create index if not exists idx_reports_status on public.reports(status);

drop trigger if exists touch_reports_updated_at on public.reports;
create trigger touch_reports_updated_at
before update on public.reports
for each row execute function public.touch_updated_at();

alter table public.reports enable row level security;

drop policy if exists "users can read own reports" on public.reports;
create policy "users can read own reports"
on public.reports
for select
to authenticated
using (public.reports.reporter_id = (select auth.uid()) or public.is_admin());

drop policy if exists "users can create own reports" on public.reports;
create policy "users can create own reports"
on public.reports
for insert
to authenticated
with check (public.reports.reporter_id = (select auth.uid()));

drop policy if exists "admins can update reports" on public.reports;
create policy "admins can update reports"
on public.reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.reports to authenticated;
