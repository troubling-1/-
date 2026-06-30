create table if not exists public.escort_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  nickname text not null default '',
  game_id text not null default '',
  contact_wechat text,
  contact_qq text,
  rank text not null default '',
  kd numeric(5,2) not null default 0,
  good_at_modes text[] not null default '{}',
  good_at_maps text[] not null default '{}',
  price numeric(10,2) not null default 1,
  intro text not null default '',
  status text not null default 'pending',
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.escort_applications
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists nickname text not null default '',
  add column if not exists game_id text not null default '',
  add column if not exists contact_wechat text,
  add column if not exists contact_qq text,
  add column if not exists rank text not null default '',
  add column if not exists kd numeric(5,2) not null default 0,
  add column if not exists good_at_modes text[] not null default '{}',
  add column if not exists good_at_maps text[] not null default '{}',
  add column if not exists price numeric(10,2) not null default 1,
  add column if not exists intro text not null default '',
  add column if not exists status text not null default 'pending',
  add column if not exists reject_reason text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.escort_applications
  drop constraint if exists escort_applications_status_check,
  add constraint escort_applications_status_check check (status in ('pending', 'approved', 'rejected'));

create table if not exists public.escorts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  application_id uuid references public.escort_applications(id) on delete set null,
  nickname text not null default '',
  game_id text,
  contact_wechat text,
  contact_qq text,
  rank text not null default 'unfilled',
  kd numeric(5,2) not null default 0,
  good_at_modes text[] not null default '{}',
  good_at_maps text[] not null default '{}',
  price numeric(10,2) not null default 1,
  intro text not null default '',
  status text not null default 'pending',
  avatar text,
  bio text not null default '',
  online_status boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.escorts
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists application_id uuid references public.escort_applications(id) on delete set null,
  add column if not exists nickname text not null default '',
  add column if not exists game_id text,
  add column if not exists contact_wechat text,
  add column if not exists contact_qq text,
  add column if not exists rank text not null default 'unfilled',
  add column if not exists kd numeric(5,2) not null default 0,
  add column if not exists good_at_modes text[] not null default '{}',
  add column if not exists good_at_maps text[] not null default '{}',
  add column if not exists price numeric(10,2) not null default 1,
  add column if not exists intro text not null default '',
  add column if not exists status text not null default 'pending',
  add column if not exists avatar text,
  add column if not exists bio text not null default '',
  add column if not exists online_status boolean not null default false,
  add column if not exists approved boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.escorts
  drop constraint if exists escorts_status_check,
  add constraint escorts_status_check check (status in ('active', 'disabled', 'pending'));

create index if not exists idx_escort_applications_user_id on public.escort_applications(user_id);
create index if not exists idx_escort_applications_status on public.escort_applications(status);
create unique index if not exists idx_escorts_user_id_unique on public.escorts(user_id);
create index if not exists idx_escorts_status on public.escorts(status);
create index if not exists idx_escorts_application_id on public.escorts(application_id);

drop trigger if exists touch_escort_applications_updated_at on public.escort_applications;
create trigger touch_escort_applications_updated_at
before update on public.escort_applications
for each row execute function public.touch_updated_at();

drop trigger if exists touch_escorts_updated_at on public.escorts;
create trigger touch_escorts_updated_at
before update on public.escorts
for each row execute function public.touch_updated_at();

create or replace function public.safe_numeric_from_text(input_value text, fallback_value numeric)
returns numeric
language plpgsql
immutable
as $$
declare
  normalized_value text;
begin
  normalized_value := btrim(coalesce(input_value, ''));

  if normalized_value = '' then
    return fallback_value;
  end if;

  if normalized_value ~ '^-?[0-9]+(\.[0-9]+)?$' then
    return normalized_value::numeric;
  end if;

  return fallback_value;
exception
  when others then
    return fallback_value;
end;
$$;

create or replace function public.safe_text_array_from_json(input_value jsonb)
returns text[]
language plpgsql
immutable
as $$
declare
  result_value text[];
  scalar_value text;
begin
  if input_value is null or input_value = 'null'::jsonb then
    return '{}'::text[];
  end if;

  if jsonb_typeof(input_value) = 'array' then
    select coalesce(array_agg(btrim(item_value)) filter (where btrim(item_value) <> ''), '{}'::text[])
    into result_value
    from jsonb_array_elements_text(input_value) as item(item_value);

    return coalesce(result_value, '{}'::text[]);
  end if;

  scalar_value := btrim(input_value::text, '"');

  if scalar_value = '' then
    return '{}'::text[];
  end if;

  scalar_value := replace(replace(scalar_value, E'\r', ','), E'\n', ',');

  select coalesce(array_agg(btrim(item_value)) filter (where btrim(item_value) <> ''), '{}'::text[])
  into result_value
  from regexp_split_to_table(scalar_value, '[,;]+') as item(item_value);

  return coalesce(result_value, '{}'::text[]);
exception
  when others then
    return '{}'::text[];
end;
$$;

insert into public.escorts (
  user_id,
  application_id,
  nickname,
  game_id,
  contact_wechat,
  contact_qq,
  rank,
  kd,
  good_at_modes,
  good_at_maps,
  price,
  intro,
  bio,
  status,
  approved
)
select
  ea.user_id::uuid,
  ea.id::uuid,
  coalesce(nullif(btrim(ea.nickname::text), ''), 'escort'),
  nullif(btrim(ea.game_id::text), ''),
  nullif(btrim(ea.contact_wechat::text), ''),
  nullif(btrim(ea.contact_qq::text), ''),
  coalesce(nullif(btrim(ea.rank::text), ''), 'unfilled'),
  public.safe_numeric_from_text(ea.kd::text, 0)::numeric(5,2),
  public.safe_text_array_from_json(to_jsonb(ea.good_at_modes)),
  public.safe_text_array_from_json(to_jsonb(ea.good_at_maps)),
  public.safe_numeric_from_text(ea.price::text, 0)::numeric(10,2),
  coalesce(nullif(btrim(ea.intro::text), ''), ''),
  coalesce(nullif(btrim(ea.intro::text), ''), ''),
  'active',
  true
from public.escort_applications ea
where ea.status = 'approved'
on conflict (user_id) do update
set
  application_id = excluded.application_id,
  nickname = excluded.nickname,
  game_id = excluded.game_id,
  contact_wechat = excluded.contact_wechat,
  contact_qq = excluded.contact_qq,
  rank = excluded.rank,
  kd = excluded.kd,
  good_at_modes = excluded.good_at_modes,
  good_at_maps = excluded.good_at_maps,
  price = excluded.price,
  intro = excluded.intro,
  bio = excluded.bio,
  status = 'active',
  approved = true,
  updated_at = now();

update public.users u
set role = 'escort',
    status = 'active',
    updated_at = now()
where exists (
  select 1
  from public.escort_applications ea
  where ea.user_id = u.id
    and ea.status = 'approved'
);

update public.escorts e
set status = 'disabled',
    approved = false,
    updated_at = now()
where not exists (
  select 1
  from public.escort_applications ea
  where ea.user_id = e.user_id
    and ea.status = 'approved'
);

update public.users u
set role = 'customer',
    updated_at = now()
where u.role = 'escort'
  and not exists (
    select 1
    from public.escorts e
    where e.user_id = u.id
      and e.status = 'active'
  );

alter table public.escort_applications enable row level security;
alter table public.escorts enable row level security;

drop policy if exists "users can read own escort applications" on public.escort_applications;
create policy "users can read own escort applications"
on public.escort_applications
for select
to authenticated
using (public.escort_applications.user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "users can create own escort applications" on public.escort_applications;
create policy "users can create own escort applications"
on public.escort_applications
for insert
to authenticated
with check (public.escort_applications.user_id = (select auth.uid()));

drop policy if exists "users can update own pending escort applications" on public.escort_applications;
create policy "users can update own pending escort applications"
on public.escort_applications
for update
to authenticated
using (public.escort_applications.user_id = (select auth.uid()) and public.escort_applications.status = 'pending')
with check (public.escort_applications.user_id = (select auth.uid()) and public.escort_applications.status = 'pending');

drop policy if exists "admins can manage all escort applications" on public.escort_applications;
create policy "admins can manage all escort applications"
on public.escort_applications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read approved escorts" on public.escorts;
drop policy if exists "public can read active escorts" on public.escorts;
create policy "public can read active escorts"
on public.escorts
for select
to anon, authenticated
using (
  public.escorts.status = 'active'
  or public.escorts.approved = true
  or public.escorts.user_id = (select auth.uid())
  or public.is_admin()
);

drop policy if exists "users can apply escort" on public.escorts;
drop policy if exists "escorts can update own profile" on public.escorts;
drop policy if exists "escorts can update own active profile" on public.escorts;
create policy "escorts can update own active profile"
on public.escorts
for update
to authenticated
using ((public.escorts.user_id = (select auth.uid()) and public.escorts.status = 'active') or public.is_admin())
with check ((public.escorts.user_id = (select auth.uid()) and public.escorts.status = 'active') or public.is_admin());

grant select on public.escorts to anon, authenticated;
grant select, insert, update on public.escort_applications to authenticated;
grant select, update on public.escorts to authenticated;
