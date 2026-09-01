import { supabase } from './supabaseClient'

export async function fetchAccounts() {
  const { data, error } = await supabase.from('accounts').select('*').eq('archived', false).order('name')
  if (error) throw error
  return data
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').eq('archived', false).order('name')
  if (error) throw error
  return data
}

export async function fetchTransactions({ month = null, limit = 500 } = {}) {
  let q = supabase
    .from('transactions')
    .select('*, accounts(name,type), categories(name)')
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (month) {
    const [y, m] = month.split('-')
    const start = `${y}-${m}-01`
    const endDate = new Date(Number(y), Number(m), 0)
    const end = endDate.toISOString().slice(0, 10)
    q = q.gte('occurred_on', start).lte('occurred_on', end)
  }
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function addTransaction(tx) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...tx, user_id: userData.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTransaction(id, patch) {
  const { data, error } = await supabase.from('transactions').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

export async function addCategory(name) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('categories').insert({ name, user_id: userData.user.id }).select().single()
  if (error) throw error
  return data
}

export async function addAccount(name, type) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('accounts').insert({ name, type, user_id: userData.user.id }).select().single()
  if (error) throw error
  return data
}

export async function fetchBills() {
  const { data, error } = await supabase.from('recurring_bills').select('*').eq('active', true).order('due_day')
  if (error) throw error
  return data
}

export async function fetchBillPayments(period) {
  const { data, error } = await supabase.from('bill_payments').select('*').eq('period', period)
  if (error) throw error
  return data
}

export async function markBillPaid(billId, period, transactionId = null) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('bill_payments')
    .upsert(
      { bill_id: billId, period, paid_on: new Date().toISOString().slice(0, 10), transaction_id: transactionId, user_id: userData.user.id },
      { onConflict: 'bill_id,period' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadReceipt(file) {
  const { data: userData } = await supabase.auth.getUser()
  const path = `${userData.user.id}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('receipts').upload(path, file)
  if (error) throw error
  return path
}

export async function getReceiptUrl(path) {
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
