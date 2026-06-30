create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  customer_id uuid references public.users(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  escort_id uuid references public.escorts(id) on delete cascade,
  escort_user_id uuid references public.users(id) on delete set null,
  rating integer not null default 5,
  content text not null default '',
  tags text[] not null default '{}',
  is_hidden boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews
  add column if not exists order_id uuid references public.orders(id) on delete cascade,
  add column if not exists customer_id uuid references public.users(id) on delete cascade,
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists escort_id uuid references public.escorts(id) on delete cascade,
  add column if not exists escort_user_id uuid references public.users(id) on delete set null,
  add column if not exists rating integer not null default 5,
  add column if not exists content text not null default '',
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.reviews
  drop constraint if exists reviews_rating_check,
  add constraint reviews_rating_check check (rating between 1 and 5);

create or replace function public.sync_review_compat_columns()
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

  if new.escort_user_id is null and new.escort_id is not null then
    select e.user_id
    into new.escort_user_id
    from public.escorts e
    where e.id = new.escort_id;
  end if;

  new.hidden = coalesce(new.hidden, new.is_hidden, false);
  new.is_hidden = coalesce(new.is_hidden, new.hidden, false);
  return new;
end;
$$;

create unique index if not exists idx_reviews_order_unique on public.reviews(order_id);
create unique index if not exists idx_reviews_order_user_unique on public.reviews(order_id, user_id);
create index if not exists idx_reviews_customer_id on public.reviews(customer_id);
create index if not exists idx_reviews_escort_id on public.reviews(escort_id);
create index if not exists idx_reviews_escort_user_id on public.reviews(escort_user_id);
create index if not exists idx_reviews_hidden on public.reviews(hidden);
create index if not exists idx_reviews_is_hidden on public.reviews(is_hidden);

drop trigger if exists sync_reviews_compat_before_write on public.reviews;
create trigger sync_reviews_compat_before_write
before insert or update on public.reviews
for each row execute function public.sync_review_compat_columns();

drop trigger if exists touch_reviews_updated_at on public.reviews;
create trigger touch_reviews_updated_at
before update on public.reviews
for each row execute function public.touch_updated_at();

update public.reviews r
set
  customer_id = coalesce(r.customer_id, r.user_id),
  user_id = coalesce(r.user_id, r.customer_id),
  escort_user_id = coalesce(r.escort_user_id, e.user_id),
  hidden = coalesce(r.hidden, r.is_hidden, false),
  is_hidden = coalesce(r.is_hidden, r.hidden, false)
from public.escorts e
where r.escort_id = e.id;

alter table public.reviews enable row level security;

drop policy if exists "reviews visible to everyone" on public.reviews;
create policy "reviews visible to everyone"
on public.reviews
for select
to anon, authenticated
using ((public.reviews.hidden = false and public.reviews.is_hidden = false) or public.is_admin());

drop policy if exists "customers can create own reviews" on public.reviews;
create policy "customers can create own reviews"
on public.reviews
for insert
to authenticated
with check (
  (public.reviews.customer_id = (select auth.uid()) or public.reviews.user_id = (select auth.uid()))
  and exists (
    select 1
    from public.orders o
    left join public.escorts e on e.id = o.escort_id
    where o.id = public.reviews.order_id
      and o.status = 'completed'
      and (o.customer_id = (select auth.uid()) or o.user_id = (select auth.uid()))
      and coalesce(o.escort_user_id, e.user_id) <> (select auth.uid())
  )
);

drop policy if exists "admins can update reviews" on public.reviews;
create policy "admins can update reviews"
on public.reviews
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.reviews to authenticated;
grant select on public.reviews to anon;
