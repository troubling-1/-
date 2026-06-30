create extension if not exists pgcrypto;

alter table public.wallets
  add column if not exists total_recharge numeric(12,2) not null default 0,
  add column if not exists total_spent numeric(12,2) not null default 0,
  add column if not exists total_withdrawn numeric(12,2) not null default 0,
  add column if not exists pending_withdraw numeric(12,2) not null default 0,
  add column if not exists role text not null default 'customer';

alter table public.wallets
  drop constraint if exists wallets_amount_non_negative,
  add constraint wallets_amount_non_negative check (
    balance >= 0
    and frozen_balance >= 0
    and total_recharge >= 0
    and total_spent >= 0
    and total_income >= 0
    and total_withdrawn >= 0
    and pending_withdraw >= 0
  );

alter table public.wallets
  drop constraint if exists wallets_role_check,
  add constraint wallets_role_check check (role in ('customer', 'escort', 'admin'));

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  withdraw_id uuid references public.withdraws(id) on delete set null,
  type text not null,
  amount numeric(12,2) not null default 0,
  balance_before numeric(12,2) not null default 0,
  balance_after numeric(12,2) not null default 0,
  status text not null default 'success',
  description text,
  created_at timestamptz not null default now()
);

alter table public.wallet_transactions
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists wallet_id uuid references public.wallets(id) on delete cascade,
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists withdraw_id uuid references public.withdraws(id) on delete set null,
  add column if not exists type text not null default 'adjustment',
  add column if not exists amount numeric(12,2) not null default 0,
  add column if not exists balance_before numeric(12,2) not null default 0,
  add column if not exists balance_after numeric(12,2) not null default 0,
  add column if not exists status text not null default 'success',
  add column if not exists description text,
  add column if not exists created_at timestamptz not null default now();

alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_type_check,
  add constraint wallet_transactions_type_check check (
    type in (
      'recharge',
      'payment',
      'freeze',
      'unfreeze',
      'refund',
      'income',
      'platform_fee',
      'withdraw_apply',
      'withdraw_success',
      'withdraw_reject',
      'adjustment'
    )
  );

alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_status_check,
  add constraint wallet_transactions_status_check check (status in ('pending', 'success', 'failed', 'cancelled'));

alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_amount_non_negative,
  add constraint wallet_transactions_amount_non_negative check (amount >= 0);

alter table public.withdraws
  add column if not exists method text not null default 'wechat',
  add column if not exists account_name text,
  add column if not exists account_no text,
  add column if not exists admin_note text,
  add column if not exists reviewed_at timestamptz;

alter table public.withdraws
  drop constraint if exists withdraws_status_check,
  add constraint withdraws_status_check check (status in ('pending', 'approved', 'paid', 'rejected', 'cancelled'));

alter table public.withdraws
  drop constraint if exists withdraws_method_check,
  add constraint withdraws_method_check check (method in ('wechat', 'alipay', 'bank'));

alter table public.withdraws
  drop constraint if exists withdraws_amount_positive,
  add constraint withdraws_amount_positive check (amount > 0);

create table if not exists public.platform_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  type text not null,
  amount numeric(12,2) not null default 0,
  description text,
  created_at timestamptz not null default now()
);

alter table public.platform_ledger
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists type text not null default 'adjustment',
  add column if not exists amount numeric(12,2) not null default 0,
  add column if not exists description text,
  add column if not exists created_at timestamptz not null default now();

alter table public.platform_ledger
  drop constraint if exists platform_ledger_type_check,
  add constraint platform_ledger_type_check check (type in ('platform_fee', 'refund', 'adjustment'));

alter table public.platform_ledger
  drop constraint if exists platform_ledger_amount_non_negative,
  add constraint platform_ledger_amount_non_negative check (amount >= 0);

create index if not exists idx_wallet_transactions_user_id on public.wallet_transactions(user_id);
create index if not exists idx_wallet_transactions_wallet_id on public.wallet_transactions(wallet_id);
create index if not exists idx_wallet_transactions_order_id on public.wallet_transactions(order_id);
create index if not exists idx_wallet_transactions_withdraw_id on public.wallet_transactions(withdraw_id);
create index if not exists idx_wallet_transactions_created_at on public.wallet_transactions(created_at desc);
create index if not exists idx_platform_ledger_order_id on public.platform_ledger(order_id);
create index if not exists idx_platform_ledger_type on public.platform_ledger(type);
create index if not exists idx_platform_ledger_created_at on public.platform_ledger(created_at desc);

drop trigger if exists touch_withdraws_updated_at on public.withdraws;
create trigger touch_withdraws_updated_at
before update on public.withdraws
for each row execute function public.touch_updated_at();

create or replace function public.ensure_wallet(target_user_id uuid, wallet_role text default 'customer')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wallet_id uuid;
begin
  insert into public.wallets (user_id, role)
  values (target_user_id, coalesce(nullif(wallet_role, ''), 'customer'))
  on conflict (user_id) do update
  set role = excluded.role,
      updated_at = now()
  returning id into target_wallet_id;

  return target_wallet_id;
end;
$$;

create or replace function public.recharge_wallet(target_user_id uuid, recharge_amount numeric)
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.wallets;
  before_balance numeric(12,2);
begin
  if recharge_amount is null or recharge_amount <= 0 then
    raise exception '充值金额必须大于 0';
  end if;

  perform public.ensure_wallet(target_user_id, 'customer');

  select *
  into wallet_row
  from public.wallets
  where user_id = target_user_id
  for update;

  before_balance := wallet_row.balance;

  update public.wallets
  set balance = balance + recharge_amount,
      total_recharge = total_recharge + recharge_amount,
      updated_at = now()
  where id = wallet_row.id
  returning * into wallet_row;

  insert into public.wallet_transactions (
    user_id,
    wallet_id,
    type,
    amount,
    balance_before,
    balance_after,
    status,
    description
  )
  values (
    target_user_id,
    wallet_row.id,
    'recharge',
    recharge_amount,
    before_balance,
    wallet_row.balance,
    'success',
    '模拟充值'
  );

  return wallet_row;
end;
$$;

create or replace function public.pay_order_with_wallet(target_order_id uuid, payer_user_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders;
  wallet_row public.wallets;
  before_balance numeric(12,2);
begin
  select *
  into order_row
  from public.orders
  where id = target_order_id
  for update;

  if order_row.id is null then
    raise exception '订单不存在';
  end if;

  if coalesce(order_row.customer_id, order_row.user_id) <> payer_user_id then
    raise exception '无权支付该订单';
  end if;

  if order_row.status <> 'pending_payment' or order_row.payment_status = 'paid' then
    raise exception '订单不能重复支付';
  end if;

  if order_row.price <= 0 then
    raise exception '订单金额不正确';
  end if;

  perform public.ensure_wallet(payer_user_id, 'customer');

  select *
  into wallet_row
  from public.wallets
  where user_id = payer_user_id
  for update;

  if wallet_row.balance < order_row.price then
    raise exception '余额不足';
  end if;

  before_balance := wallet_row.balance;

  update public.wallets
  set balance = balance - order_row.price,
      frozen_balance = frozen_balance + order_row.price,
      total_spent = total_spent + order_row.price,
      updated_at = now()
  where id = wallet_row.id
  returning * into wallet_row;

  update public.orders
  set status = 'pending',
      payment_status = 'paid',
      paid_at = now(),
      platform_fee = round((price * 0.20)::numeric, 2),
      escort_income = round((price * 0.80)::numeric, 2),
      updated_at = now()
  where id = target_order_id
  returning * into order_row;

  insert into public.wallet_transactions (user_id, wallet_id, order_id, type, amount, balance_before, balance_after, status, description)
  values
    (payer_user_id, wallet_row.id, target_order_id, 'payment', order_row.price, before_balance, wallet_row.balance, 'success', '订单余额支付'),
    (payer_user_id, wallet_row.id, target_order_id, 'freeze', order_row.price, wallet_row.balance, wallet_row.balance, 'success', '订单金额进入托管冻结');

  return order_row;
end;
$$;

create or replace function public.confirm_order_settlement(target_order_id uuid, confirmer_user_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders;
  customer_wallet public.wallets;
  escort_wallet public.wallets;
  customer_before numeric(12,2);
  escort_before numeric(12,2);
  fee_amount numeric(12,2);
  income_amount numeric(12,2);
begin
  select *
  into order_row
  from public.orders
  where id = target_order_id
  for update;

  if order_row.id is null then
    raise exception '订单不存在';
  end if;

  if coalesce(order_row.customer_id, order_row.user_id) <> confirmer_user_id then
    raise exception '无权确认该订单';
  end if;

  if order_row.status = 'completed' then
    raise exception '订单已结算，不能重复结算';
  end if;

  if order_row.status <> 'pending_confirm' or order_row.payment_status <> 'paid' then
    raise exception '订单当前不能确认完成';
  end if;

  if order_row.escort_user_id is null then
    raise exception '订单缺少护航师，无法结算';
  end if;

  fee_amount := coalesce(nullif(order_row.platform_fee, 0), round((order_row.price * 0.20)::numeric, 2));
  income_amount := coalesce(nullif(order_row.escort_income, 0), order_row.price - fee_amount);

  perform public.ensure_wallet(confirmer_user_id, 'customer');
  perform public.ensure_wallet(order_row.escort_user_id, 'escort');

  select *
  into customer_wallet
  from public.wallets
  where user_id = confirmer_user_id
  for update;

  if customer_wallet.frozen_balance < order_row.price then
    raise exception '用户冻结金额不足，无法结算';
  end if;

  select *
  into escort_wallet
  from public.wallets
  where user_id = order_row.escort_user_id
  for update;

  customer_before := customer_wallet.balance;
  escort_before := escort_wallet.balance;

  update public.wallets
  set frozen_balance = frozen_balance - order_row.price,
      updated_at = now()
  where id = customer_wallet.id
  returning * into customer_wallet;

  update public.wallets
  set balance = balance + income_amount,
      total_income = total_income + income_amount,
      role = 'escort',
      updated_at = now()
  where id = escort_wallet.id
  returning * into escort_wallet;

  update public.orders
  set status = 'completed',
      completed_at = coalesce(completed_at, now()),
      confirmed_at = now(),
      platform_fee = fee_amount,
      escort_income = income_amount,
      updated_at = now()
  where id = target_order_id
  returning * into order_row;

  insert into public.wallet_transactions (user_id, wallet_id, order_id, type, amount, balance_before, balance_after, status, description)
  values
    (confirmer_user_id, customer_wallet.id, target_order_id, 'payment', order_row.price, customer_before, customer_wallet.balance, 'success', '订单确认完成，托管扣款完成'),
    (order_row.escort_user_id, escort_wallet.id, target_order_id, 'income', income_amount, escort_before, escort_wallet.balance, 'success', '订单完成收入'),
    (order_row.escort_user_id, escort_wallet.id, target_order_id, 'platform_fee', fee_amount, escort_wallet.balance, escort_wallet.balance, 'success', '平台服务费');

  insert into public.platform_ledger (order_id, type, amount, description)
  values (target_order_id, 'platform_fee', fee_amount, '订单完成平台服务费');

  return order_row;
end;
$$;

create or replace function public.apply_withdraw(
  target_user_id uuid,
  withdraw_amount numeric,
  withdraw_method text,
  withdraw_account_name text,
  withdraw_account_no text,
  withdraw_note text
)
returns public.withdraws
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.wallets;
  withdraw_row public.withdraws;
  before_balance numeric(12,2);
begin
  if withdraw_amount is null or withdraw_amount <= 0 then
    raise exception '提现金额必须大于 0';
  end if;

  if withdraw_method not in ('wechat', 'alipay', 'bank') then
    raise exception '提现方式不正确';
  end if;

  perform public.ensure_wallet(target_user_id, 'escort');

  select *
  into wallet_row
  from public.wallets
  where user_id = target_user_id
  for update;

  if wallet_row.balance < withdraw_amount then
    raise exception '可提现余额不足';
  end if;

  before_balance := wallet_row.balance;

  update public.wallets
  set balance = balance - withdraw_amount,
      pending_withdraw = pending_withdraw + withdraw_amount,
      role = 'escort',
      updated_at = now()
  where id = wallet_row.id
  returning * into wallet_row;

  insert into public.withdraws (user_id, amount, method, account_name, account_no, status, admin_note)
  values (target_user_id, withdraw_amount, withdraw_method, withdraw_account_name, withdraw_account_no, 'pending', nullif(withdraw_note, ''))
  returning * into withdraw_row;

  insert into public.wallet_transactions (user_id, wallet_id, withdraw_id, type, amount, balance_before, balance_after, status, description)
  values (target_user_id, wallet_row.id, withdraw_row.id, 'withdraw_apply', withdraw_amount, before_balance, wallet_row.balance, 'pending', '提现申请');

  return withdraw_row;
end;
$$;

create or replace function public.review_withdraw(target_withdraw_id uuid, review_action text, note text default null)
returns public.withdraws
language plpgsql
security definer
set search_path = public
as $$
declare
  withdraw_row public.withdraws;
  wallet_row public.wallets;
  before_balance numeric(12,2);
begin
  select *
  into withdraw_row
  from public.withdraws
  where id = target_withdraw_id
  for update;

  if withdraw_row.id is null then
    raise exception '提现记录不存在';
  end if;

  select *
  into wallet_row
  from public.wallets
  where user_id = withdraw_row.user_id
  for update;

  before_balance := wallet_row.balance;

  if review_action = 'approve' then
    if withdraw_row.status <> 'pending' then
      raise exception '只有待审核提现可以通过';
    end if;

    update public.withdraws
    set status = 'approved',
        admin_note = nullif(note, ''),
        reviewed_at = now(),
        updated_at = now()
    where id = target_withdraw_id
    returning * into withdraw_row;
  elsif review_action = 'paid' then
    if withdraw_row.status <> 'approved' then
      raise exception '只有已通过提现可以确认打款';
    end if;

    update public.wallets
    set pending_withdraw = pending_withdraw - withdraw_row.amount,
        total_withdrawn = total_withdrawn + withdraw_row.amount,
        updated_at = now()
    where id = wallet_row.id
    returning * into wallet_row;

    update public.withdraws
    set status = 'paid',
        paid_at = now(),
        reviewed_at = coalesce(reviewed_at, now()),
        admin_note = nullif(note, ''),
        updated_at = now()
    where id = target_withdraw_id
    returning * into withdraw_row;

    insert into public.wallet_transactions (user_id, wallet_id, withdraw_id, type, amount, balance_before, balance_after, status, description)
    values (withdraw_row.user_id, wallet_row.id, withdraw_row.id, 'withdraw_success', withdraw_row.amount, before_balance, wallet_row.balance, 'success', '管理员确认打款');
  elsif review_action = 'reject' then
    if withdraw_row.status not in ('pending', 'approved') then
      raise exception '当前提现不能拒绝';
    end if;

    if note is null or length(btrim(note)) < 2 then
      raise exception '拒绝提现必须填写原因';
    end if;

    update public.wallets
    set balance = balance + withdraw_row.amount,
        pending_withdraw = pending_withdraw - withdraw_row.amount,
        updated_at = now()
    where id = wallet_row.id
    returning * into wallet_row;

    update public.withdraws
    set status = 'rejected',
        admin_note = note,
        reject_reason = note,
        reviewed_at = now(),
        updated_at = now()
    where id = target_withdraw_id
    returning * into withdraw_row;

    insert into public.wallet_transactions (user_id, wallet_id, withdraw_id, type, amount, balance_before, balance_after, status, description)
    values (withdraw_row.user_id, wallet_row.id, withdraw_row.id, 'withdraw_reject', withdraw_row.amount, before_balance, wallet_row.balance, 'cancelled', '提现拒绝退回余额');
  else
    raise exception '提现审核操作不正确';
  end if;

  return withdraw_row;
end;
$$;

alter table public.wallet_transactions enable row level security;
alter table public.platform_ledger enable row level security;

drop policy if exists "wallet transactions visible to owner and admin" on public.wallet_transactions;
create policy "wallet transactions visible to owner and admin"
on public.wallet_transactions
for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "admins can read platform ledger" on public.platform_ledger;
create policy "admins can read platform ledger"
on public.platform_ledger
for select
to authenticated
using (public.is_admin());

grant select on public.wallet_transactions to authenticated;
grant select on public.platform_ledger to authenticated;
grant execute on function public.ensure_wallet(uuid, text) to service_role;
grant execute on function public.recharge_wallet(uuid, numeric) to service_role;
grant execute on function public.pay_order_with_wallet(uuid, uuid) to service_role;
grant execute on function public.confirm_order_settlement(uuid, uuid) to service_role;
grant execute on function public.apply_withdraw(uuid, numeric, text, text, text, text) to service_role;
grant execute on function public.review_withdraw(uuid, text, text) to service_role;
