import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  fetchTransactions, fetchAccounts, fetchCategories,
  addTransaction, updateTransaction, deleteTransaction, uploadReceipt,
} from '../lib/data'
import { formatINR } from '../lib/format'
import { transactionsToCSV, downloadCSV } from '../lib/csv'

const TYPES = ['Expense', 'Income', 'Transfer OUT', 'Transfer IN']

export default function Transactions() {
  const [params, setParams] = useSearchParams()
  const [txns, setTxns] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState(null)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  async function load() {
    setLoading(true)
    const [t, a, c] = await Promise.all([
      fetchTransactions({ limit: 1000, search, type: filterType, accountId: filterAccount, categoryId: filterCategory }),
      fetchAccounts(), fetchCategories(),
    ])
    setTxns(t); setAccounts(a); setCategories(c)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, filterType, filterAccount, filterCategory])

  function handleExport() {
    const csv = transactionsToCSV(txns)
    downloadCSV(csv, `ledgerly-transactions-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  function clearFilters() {
    setSearch(''); setFilterType(''); setFilterAccount(''); setFilterCategory('')
  }

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(t) {
    setEditing(t)
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return
    await deleteTransaction(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-3xl text-ink">Transactions</div>
        <button
          onClick={openNew}
          className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-sans font-semibold hover:bg-inkdeep"
        >
          Add transaction
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          className="flex-1 px-3 py-2 bg-white border border-line rounded-sm font-sans text-sm"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-sm text-sm font-sans border ${showFilters ? 'border-ink text-ink' : 'border-line text-textmuted'}`}
        >
          Filters
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-2 rounded-sm text-sm font-sans border border-line text-textmuted hover:border-ink hover:text-ink"
        >
          Export CSV
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-line/60 rounded-sm p-4 mb-4 grid grid-cols-3 gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1.5 bg-white border border-line rounded-sm font-sans text-sm">
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}
            className="px-2 py-1.5 bg-white border border-line rounded-sm font-sans text-sm">
            <option value="">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2 py-1.5 bg-white border border-line rounded-sm font-sans text-sm">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(filterType || filterAccount || filterCategory || search) && (
            <button onClick={clearFilters} className="col-span-3 text-xs text-textmuted font-sans text-left hover:text-ink">
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="text-xs text-textmuted font-sans mb-3">{txns.length} transaction{txns.length !== 1 ? 's' : ''}</div>

      {loading ? (
        <div className="text-textmuted font-sans text-sm">Loading…</div>
      ) : txns.length === 0 ? (
        <div className="text-textmuted font-sans text-sm">No transactions yet. Add your first one above.</div>
      ) : (
        <div className="bg-white border border-line/60 rounded-sm divide-y divide-line/40">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm font-sans">
              <div className="min-w-0">
                <div className="text-textdark truncate">{t.categories?.name || 'Uncategorized'}</div>
                <div className="text-textmuted text-xs mt-0.5 truncate">
                  {t.occurred_on} · {t.accounts?.name || '—'} {t.note ? `· ${t.note}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`tabular ${t.type === 'Income' || t.type === 'Transfer IN' ? 'text-positive' : 'text-negative'}`}>
                  {t.type === 'Income' || t.type === 'Transfer IN' ? '+' : '−'}{formatINR(t.amount)}
                </span>
                <button onClick={() => openEdit(t)} className="text-textmuted hover:text-ink text-xs">Edit</button>
                <button onClick={() => handleDelete(t.id)} className="text-textmuted hover:text-negative text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); setParams({}) }}
          onSaved={() => { setShowForm(false); setEditing(null); setParams({}); load() }}
        />
      )}
    </div>
  )
}

function TransactionForm({ accounts, categories, initial, onClose, onSaved }) {
  const [type, setType] = useState(initial?.type || 'Expense')
  const [accountId, setAccountId] = useState(initial?.account_id || accounts[0]?.id || '')
  const [categoryId, setCategoryId] = useState(initial?.category_id || categories[0]?.id || '')
  const [amount, setAmount] = useState(initial?.amount || '')
  const [date, setDate] = useState(initial?.occurred_on || new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState(initial?.note || '')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      let receipt_path = initial?.receipt_path || null
      if (file) receipt_path = await uploadReceipt(file)
      const payload = {
        type, account_id: accountId || null, category_id: categoryId || null,
        amount: Number(amount), occurred_on: date, note, receipt_path,
      }
      if (initial) await updateTransaction(initial.id, payload)
      else await addTransaction(payload)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-30" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-paper w-full md:max-w-md rounded-t-sm md:rounded-sm p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="font-display text-xl text-ink mb-4">{initial ? 'Edit transaction' : 'Add transaction'}</div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`py-2 rounded-sm text-sm font-sans border ${type === t ? 'bg-ink text-paper border-ink' : 'border-line text-textmuted'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <Field label="Amount (₹)">
          <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-line rounded-sm font-sans tabular" />
        </Field>

        <Field label="Date">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-line rounded-sm font-sans" />
        </Field>

        <Field label="Account">
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-line rounded-sm font-sans">
            <option value="">—</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>

        <Field label="Category">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-line rounded-sm font-sans">
            <option value="">—</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="Note">
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-line rounded-sm font-sans" />
        </Field>

        <Field label="Receipt photo (optional)">
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm font-sans" />
        </Field>

        {error && <div className="text-negative text-sm mb-3 font-sans">{error}</div>}

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm border border-line text-textmuted font-sans text-sm">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="flex-1 py-2.5 rounded-sm bg-ink text-paper font-sans text-sm font-medium disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-xs uppercase tracking-wide text-textmuted mb-1 font-sans">{label}</label>
      {children}
    </div>
  )
}
