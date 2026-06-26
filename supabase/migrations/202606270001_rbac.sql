alter table public.users
  alter column role drop default,
  alter column role type text using role::text,
  alter column role set default 'customer';

update public.users
set role = 'customer'
where role = 'player';

alter table public.users
  add column if not exists status text not null default 'active';

alter table public.users
  add column if not exists email text;

alter table public.users
  drop constraint if exists users_role_check,
  add constraint users_role_check check (role in ('customer', 'escort', 'admin'));

alter table public.users
  drop constraint if exists users_status_check,
  add constraint users_status_check check (status in ('active', 'banned'));

create table if not exists public.escort_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  game_id text not null check (char_length(game_id) between 1 and 50),
  contact_wechat text,
  contact_qq text,
  rank text not null,
  kd numeric(5,2) not null default 0 check (kd >= 0 and kd <= 20),
  good_at_modes text[] not null default '{}',
  good_at_maps text[] not null default '{}',
  price numeric(10,2) not null check (price >= 1 and price <= 9999),
  intro text not null check (char_length(intro) between 10 and 500),
  status text not null default 'pending',
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint escort_applications_status_check check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists idx_escort_applications_user_id on public.escort_applications(user_id);
create index if not exists idx_escort_applications_status on public.escort_applications(status);
create unique index if not exists idx_escorts_user_id_unique on public.escorts(user_id);

alter table public.escort_applications enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_escort_applications_updated_at on public.escort_applications;
create trigger touch_escort_applications_updated_at
before update on public.escort_applications
for each row execute procedure public.touch_updated_at();

drop policy if exists "users can read own escort applications" on public.escort_applications;
create policy "users can read own escort applications"
on public.escort_applications for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "users can create own escort applications" on public.escort_applications;
create policy "users can create own escort applications"
on public.escort_applications for insert
with check (user_id = auth.uid());

drop policy if exists "users can update own pending escort applications" on public.escort_applications;
create policy "users can update own pending escort applications"
on public.escort_applications for update
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "admins can manage all escort applications" on public.escort_applications;
create policy "admins can manage all escort applications"
on public.escort_applications for all
using (public.is_admin())
with check (public.is_admin());

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, nickname, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1), '玩家'),
    'customer',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
