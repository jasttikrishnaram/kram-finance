-- ============================================================
-- Kram Finance — Database schema
-- Run this once in Supabase: Project → SQL Editor → New query → Run
-- ============================================================

-- ACCOUNTS (bank accounts + credit cards)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'credit_card')),
  credit_limit numeric,
  due_day int,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- CATEGORIES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- TRANSACTIONS
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  occurred_at time,
  type text not null check (type in ('Income', 'Expense', 'Transfer IN', 'Transfer OUT')),
  payment_mode text,
  account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  amount numeric not null check (amount >= 0),
  note text,
  receipt_path text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date on transactions(user_id, occurred_on desc);
create index if not exists idx_transactions_account on transactions(account_id);
create index if not exists idx_transactions_category on transactions(category_id);

-- RECURRING BILLS / EMIs ("Monthly needed funds")
create table if not exists recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text,
  due_day int not null check (due_day between 1 and 31),
  amount numeric not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- BILL PAYMENTS (log of which month's bill was marked paid, optionally linked to a transaction)
create table if not exists bill_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_id uuid not null references recurring_bills(id) on delete cascade,
  period text not null, -- e.g. '2026-08'
  paid_on date,
  transaction_id uuid references transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bill_id, period)
);

-- ============================================================
-- Row Level Security — every table only visible to its owner
-- ============================================================
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table recurring_bills enable row level security;
alter table bill_payments enable row level security;

create policy "own accounts" on accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own categories" on categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own transactions" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bills" on recurring_bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bill_payments" on bill_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for receipt photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "own receipt files read"
  on storage.objects for select
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own receipt files insert"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own receipt files delete"
  on storage.objects for delete
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
