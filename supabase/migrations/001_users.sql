create extension if not exists "pgcrypto";

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text not null default 'user',
  avatar text,
  role text not null default 'customer',
  status text not null default 'active',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists email text,
  add column if not exists nickname text not null default 'user',
  add column if not exists avatar text,
  add column if not exists role text not null default 'customer',
  add column if not exists status text not null default 'active',
  add column if not exists phone text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.users
  drop constraint if exists users_role_check,
  add constraint users_role_check check (role in ('customer', 'escort', 'admin'));

alter table public.users
  drop constraint if exists users_status_check,
  add constraint users_status_check check (status in ('active', 'banned'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.role = 'admin'
      and u.status = 'active'
  );
$$;

drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

alter table public.users enable row level security;

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile"
on public.users
for select
to authenticated
using (public.users.id = (select auth.uid()) or public.is_admin());

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
on public.users
for update
to authenticated
using (public.users.id = (select auth.uid()))
with check (public.users.id = (select auth.uid()));

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.users to authenticated;
