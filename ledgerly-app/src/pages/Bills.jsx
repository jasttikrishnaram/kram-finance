import { useEffect, useState } from 'react'
import {
  fetchBills, fetchBillPayments, markBillPaid, addTransaction, fetchAccounts, fetchCategories,
  fetchTransactions, addRecurringBill,
} from '../lib/data'
import { formatINR, currentPeriod, monthLabel } from '../lib/format'
import { detectRecurring } from '../lib/recurring'

export default function Bills() {
  const [period, setPeriod] = useState(currentPeriod())
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [addingKey, setAddingKey] = useState(null)

  async function load() {
    setLoading(true)
    const [b, p, allTxns] = await Promise.all([fetchBills(), fetchBillPayments(period), fetchTransactions({ limit: 3000 })])
    setBills(b); setPayments(p)
    setSuggestions(detectRecurring(allTxns, b))
    setLoading(false)
  }

  useEffect(() => { load() }, [period])

  async function handleAddSuggestion(s) {
    setAddingKey(s.category + s.avgAmount)
    try {
      await addRecurringBill({ name: s.category, due_day: s.commonDay, amount: s.avgAmount })
      load()
    } finally {
      setAddingKey(null)
    }
  }

  const paidBillIds = new Set(payments.map((p) => p.bill_id))
  const today = new Date()
  const isCurrentMonth = period === currentPeriod()
  const todayDay = today.getDate()

  async function handleMarkPaid(bill) {
    setBusyId(bill.id)
    try {
      // Log it as an expense transaction too, so it shows in the ledger
      const [accounts, categories] = await Promise.all([fetchAccounts(), fetchCategories()])
      const emiCategory = categories.find((c) => c.name.toLowerCase().includes('loan') || c.name.toLowerCase().includes('rent'))
      const txn = await addTransaction({
        type: 'Expense',
        account_id: accounts[0]?.id || null,
        category_id: emiCategory?.id || null,
        amount: bill.amount,
        occurred_on: new Date().toISOString().slice(0, 10),
        note: `${bill.name} — ${monthLabel(period)}`,
      })
      await markBillPaid(bill.id, period, txn.id)
      load()
    } finally {
      setBusyId(null)
    }
  }

  const total = bills.reduce((s, b) => s + Number(b.amount), 0)
  const paidTotal = bills.filter((b) => paidBillIds.has(b.id)).reduce((s, b) => s + Number(b.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="font-display text-3xl text-ink">Bills & EMIs</div>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-line rounded-sm px-3 py-1.5 text-sm bg-white font-sans"
        />
      </div>

      <div className="bg-white border border-line/60 rounded-sm p-5 mb-6">
        <div className="flex justify-between text-sm font-sans mb-2">
          <span className="text-textmuted">Paid this month</span>
          <span className="tabular">{formatINR(paidTotal)} / {formatINR(total)}</span>
        </div>
        <div className="h-2 bg-paperdim rounded-full overflow-hidden">
          <div className="h-full bg-positive" style={{ width: `${total ? Math.round((paidTotal / total) * 100) : 0}%` }} />
        </div>
      </div>

      {loading ? (
        <div className="text-textmuted font-sans text-sm">Loading…</div>
      ) : (
        <div className="bg-white border border-line/60 rounded-sm divide-y divide-line/40">
          {bills.map((b) => {
            const paid = paidBillIds.has(b.id)
            const overdue = isCurrentMonth && !paid && todayDay > b.due_day
            return (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm font-sans">
                <div>
                  <div className="text-textdark">{b.name}</div>
                  <div className="text-textmuted text-xs mt-0.5">
                    {b.bank} · Due {b.due_day}{ordinal(b.due_day)}
                    {overdue && <span className="text-negative ml-2">Overdue</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-textdark">{formatINR(b.amount)}</span>
                  {paid ? (
                    <span className="text-positive text-xs font-medium">Paid ✓</span>
                  ) : (
                    <button
                      onClick={() => handleMarkPaid(b)}
                      disabled={busyId === b.id}
                      className="text-xs px-2.5 py-1 rounded-sm border border-line text-textmuted hover:border-ink hover:text-ink disabled:opacity-50"
                    >
                      {busyId === b.id ? '…' : 'Mark paid'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 text-xs text-textmuted font-sans mb-8">
        Marking a bill paid logs it as an expense in Transactions too, so your ledger and bill tracker always agree.
      </div>

      {suggestions.length > 0 && (
        <div>
          <div className="font-display text-xl text-ink mb-1">Suggested recurring bills</div>
          <div className="text-textmuted text-xs font-sans mb-3">
            Detected from spending that repeats in the same category and amount across 3+ months.
          </div>
          <div className="bg-white border border-line/60 rounded-sm divide-y divide-line/40">
            {suggestions.map((s) => {
              const key = s.category + s.avgAmount
              return (
                <div key={key} className="flex items-center justify-between px-4 py-3 text-sm font-sans">
                  <div>
                    <div className="text-textdark">{s.category}</div>
                    <div className="text-textmuted text-xs mt-0.5">
                      Seen in {s.monthsSeen} months · usually around the {s.commonDay}
                      {ordinal(s.commonDay)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular text-textdark">~{formatINR(s.avgAmount)}</span>
                    <button
                      onClick={() => handleAddSuggestion(s)}
                      disabled={addingKey === key}
                      className="text-xs px-2.5 py-1 rounded-sm border border-line text-textmuted hover:border-ink hover:text-ink disabled:opacity-50"
                    >
                      {addingKey === key ? '…' : 'Add as bill'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
