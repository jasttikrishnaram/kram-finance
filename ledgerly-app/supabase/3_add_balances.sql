-- ============================================================
-- Ledgerly — Add bank balance tracking to accounts
-- Run this once in Supabase SQL Editor.
-- ============================================================

alter table accounts add column if not exists opening_balance numeric not null default 0;
alter table accounts add column if not exists statement_balance numeric;
alter table accounts add column if not exists statement_date date;

comment on column accounts.opening_balance is 'Balance in this account before your first tracked transaction';
comment on column accounts.statement_balance is 'Actual balance from your bank/card statement, entered manually for reconciliation';
comment on column accounts.statement_date is 'Date the statement_balance was checked/entered';
