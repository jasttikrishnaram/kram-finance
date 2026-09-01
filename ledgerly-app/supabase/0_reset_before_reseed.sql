-- Run this ONLY if a previous seed attempt partially inserted data
-- (e.g. you hit the "Transfer Out" error). This clears your transactions,
-- accounts, categories, and bills so you can re-run the corrected seed
-- file cleanly, without duplicates. Your login/user account is NOT affected.

delete from bill_payments where user_id = (select id from auth.users order by created_at asc limit 1);
delete from transactions where user_id = (select id from auth.users order by created_at asc limit 1);
delete from recurring_bills where user_id = (select id from auth.users order by created_at asc limit 1);
delete from accounts where user_id = (select id from auth.users order by created_at asc limit 1);
delete from categories where user_id = (select id from auth.users order by created_at asc limit 1);
