# Kram Finance

Your personal finance tracker, rebuilt from your Excel workbook into a real web app —
accessible from any phone, tablet, or computer, with your data stored securely in the cloud.

## What's in this folder

- `src/` — the app itself (React)
- `supabase/schema.sql` — creates your database tables (run once)
- `supabase/seed_data.sql` — imports your 709 existing transactions + your EMI list (run once, after schema)
- `.env.example` — your Supabase connection details (already filled in for you)

---

## Setup (about 10 minutes, one-time)

### 1. Run the database schema

1. Go to your Supabase project → **SQL Editor** → **New query**
2. Open `supabase/schema.sql` from this folder, copy all of it, paste it in, click **Run**
3. You should see "Success. No rows returned"

This creates all your tables (transactions, accounts, categories, bills) and locks each one down
so only you can ever see your own data (Row Level Security).

### 2. Create your login

You don't need to do anything special here — just open the app once it's deployed (step 4) and use
the **"First time here? Create an account"** link with your email + a password. Confirm the email
Supabase sends you, then sign in.

### 3. Import your existing 709 transactions

Once you've signed in at least once (so your user account exists):

1. Go back to Supabase → **SQL Editor** → **New query**
2. Open `supabase/seed_data.sql`, copy all of it, paste it in, click **Run**

This loads all your accounts, categories, transaction history, and your EMI/bill list from the
Excel file — nothing is lost.

### 4. Deploy the app (get your live link)

The easiest way, no coding required:

1. Create a free account at github.com if you don't have one
2. Create a new **empty** repository (e.g. `kram-finance`)
3. Upload this whole folder's contents to that repository (GitHub's website lets you drag-and-drop
   files directly — use "Add file → Upload files")
4. Go to vercel.com, sign in with GitHub
5. Click **Add New → Project**, select your `kram-finance` repo, click **Import**
6. Under **Project Name**, type something short — e.g. `kram-finance` — this becomes your URL:
   `kram-finance.vercel.app`
7. Before clicking Deploy, expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = `https://xrchnyeafuppadzvljxz.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_VamDi7YxBdQPMbYbzmkLQA_mj--jbWz`
8. Click **Deploy**. In about a minute you'll get your live link.

That's it — open that link on your phone, tap "Add to Home Screen" for a proper app icon, and it's
ready everywhere you are.

---

## Using it day to day

- **Dashboard** — this month's income, expenses, savings rate, top categories, credit card usage, upcoming bills
- **Transactions** — your full ledger; add, edit, delete, attach a receipt photo
- **Bills & EMIs** — your fixed monthly obligations; mark paid and it logs the expense automatically
- **Insights** — all-time totals, spending by category/account, auto-generated alerts
- **Settings** — add new accounts or categories any time, no code changes needed

## Your data, your control

- Only you can see your data — every table is locked to your login (Row Level Security)
- Receipt photos are stored privately, not publicly accessible
- You can export your data any time via Supabase's Table Editor → Export CSV
- Everything is free at this scale (Supabase and Vercel free tiers)

## What's next (optional upgrades, once you're using it)

- **Push/email reminders** before each EMI due date — needs a small scheduled function in Supabase (I can build this next)
- **Automatic receipt scanning (OCR)** to pre-fill amounts from a photo
- **Budgets per category** with over-budget warnings
