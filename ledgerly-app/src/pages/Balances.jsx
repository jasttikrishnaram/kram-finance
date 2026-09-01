import { useEffect, useMemo, useState } from 'react'
import { fetchAccounts, fetchTransactions, updateAccount } from '../lib/data'
import { formatINR } from '../lib/format'

const SIGN = { Income: 1, 'Transfer IN': 1, Expense: -1, 'Transfer OUT': -1 }

export default function Balances() {
  const [accounts, setAccounts] = useState([])
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    const [a, t] = await Promise.all([fetchAccounts(), fetchTransactions({ limit: 5000 })])
    setAccounts(a); setTxns(t)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const computed = useMemo(() => {
    return accounts.map((acc) => {
      const movement = txns
        .filter((t) => t.account_id === acc.id)
        .reduce((sum, t) => sum + (SIGN[t.type] || 0) * Number(t.amount), 0)
      const runningBalance = Number(acc.opening_balance || 0) + movement
      const diff = acc.statement_balance != null ? Number(acc.statement_balance) - runningBalance : null
      return { ...acc, runningBalance, diff }
    })
  }, [accounts, txns])

  if (loading) return <div className="text-textmuted font-sans text-sm">Loading…</div>

  return (
    <div>
      <div className="font-display text-3xl text-ink mb-2">Balances</div>
      <div className="text-textmuted text-sm font-sans mb-6">
        Running balance is calculated from your transactions. Enter your real statement balance to check they match.
      </div>

      <div className="space-y-3">
        {computed.map((acc) => (
          <div key={acc.id} className="bg-white border border-line/60 rounded-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-ink font-sans">{acc.name}</div>
                <div className="text-xs text-textmuted font-sans capitalize">{acc.type.replace('_', ' ')}</div>
              </div>
              <button
                onClick={() => setEditing(editing === acc.id ? null : acc.id)}
                className="text-xs px-2.5 py-1 rounded-sm border border-line text-textmuted hover:border-ink hover:text-ink font-sans"
              >
                {editing === acc.id ? 'Close' : 'Update'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-textmuted font-sans uppercase tracking-wide">Running balance</div>
                <div className="font-display text-xl tabular text-ink">{formatINR(acc.runningBalance)}</div>
              </div>
              <div>
                <div className="text-xs text-textmuted font-sans uppercase tracking-wide">Statement balance</div>
                <div className="font-display text-xl tabular text-ink">
                  {acc.statement_balance != null ? formatINR(acc.statement_balance) : '—'}
                </div>
              </div>
            </div>

            {acc.diff !== null && (
              <div className={`mt-3 text-xs font-sans px-2.5 py-1.5 rounded-sm inline-block ${
                Math.abs(acc.diff) < 1 ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
              }`}>
                {Math.abs(acc.diff) < 1
                  ? 'Matches your statement ✓'
                  : `Off by ${formatINR(Math.abs(acc.diff))} — ${acc.diff > 0 ? 'statement is higher' : 'ledger is higher'}`}
              </div>
            )}
            {acc.statement_date && (
              <div className="text-xs text-textmuted font-sans mt-1">Checked {acc.statement_date}</div>
            )}

            {editing === acc.id && (
              <BalanceEditForm account={acc} onSaved={() => { setEditing(null); load() }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BalanceEditForm({ account, onSaved }) {
  const [opening, setOpening] = useState(account.opening_balance || 0)
  const [statement, setStatement] = useState(account.statement_balance ?? '')
  const [statementDate, setStatementDate] = useState(account.statement_date || new Date().toISOString().slice(0, 10))
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    setBusy(true)
    try {
      await updateAccount(account.id, {
        opening_balance: Number(opening) || 0,
        statement_balance: statement === '' ? null : Number(statement),
        statement_date: statement === '' ? null : statementDate,
      })
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-line/40 grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs uppercase tracking-wide text-textmuted mb-1 font-sans">Opening balance</label>
        <input type="number" value={opening} onChange={(e) => setOpening(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-line rounded-sm font-sans text-sm tabular" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-textmuted mb-1 font-sans">Statement balance</label>
        <input type="number" value={statement} onChange={(e) => setStatement(e.target.value)}
          placeholder="e.g. from bank app"
          className="w-full px-3 py-2 bg-white border border-line rounded-sm font-sans text-sm tabular" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-textmuted mb-1 font-sans">Checked on</label>
        <input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-line rounded-sm font-sans text-sm" />
      </div>
      <div className="flex items-end">
        <button onClick={handleSave} disabled={busy}
          className="w-full py-2 rounded-sm bg-ink text-paper font-sans text-sm font-semibold disabled:opacity-50">
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
