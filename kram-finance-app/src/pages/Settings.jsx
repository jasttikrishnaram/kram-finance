import { useEffect, useState } from 'react'
import { fetchAccounts, fetchCategories, addAccount, addCategory } from '../lib/data'
import { useAuth } from '../lib/useAuth'

export default function Settings() {
  const { session, signOut } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [newAccount, setNewAccount] = useState('')
  const [newAccountType, setNewAccountType] = useState('bank')
  const [newCategory, setNewCategory] = useState('')

  async function load() {
    const [a, c] = await Promise.all([fetchAccounts(), fetchCategories()])
    setAccounts(a); setCategories(c)
  }
  useEffect(() => { load() }, [])

  async function handleAddAccount(e) {
    e.preventDefault()
    if (!newAccount.trim()) return
    await addAccount(newAccount.trim(), newAccountType)
    setNewAccount('')
    load()
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategory.trim()) return
    await addCategory(newCategory.trim())
    setNewCategory('')
    load()
  }

  return (
    <div>
      <div className="font-display text-3xl text-ink mb-6">Settings</div>

      <div className="bg-white border border-line/60 rounded-sm p-5 mb-6">
        <div className="text-sm font-sans font-medium text-ink mb-1">Signed in as</div>
        <div className="text-sm font-sans text-textmuted mb-3">{session?.user?.email}</div>
        <button onClick={signOut} className="text-sm font-sans text-negative">Sign out</button>
      </div>

      <div className="bg-white border border-line/60 rounded-sm p-5 mb-6">
        <div className="text-sm font-sans font-medium text-ink mb-3">Accounts</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {accounts.map((a) => (
            <span key={a.id} className="text-xs font-sans px-2.5 py-1 rounded-sm bg-paperdim text-textdark">
              {a.name} <span className="text-textmuted">({a.type === 'credit_card' ? 'card' : 'bank'})</span>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddAccount} className="flex gap-2">
          <input
            value={newAccount}
            onChange={(e) => setNewAccount(e.target.value)}
            placeholder="e.g. SBI-1234"
            className="flex-1 px-3 py-2 bg-white border border-line rounded-sm font-sans text-sm"
          />
          <select value={newAccountType} onChange={(e) => setNewAccountType(e.target.value)}
            className="px-2 py-2 bg-white border border-line rounded-sm font-sans text-sm">
            <option value="bank">Bank</option>
            <option value="credit_card">Credit card</option>
          </select>
          <button className="px-4 py-2 bg-ink text-paper rounded-sm text-sm font-sans">Add</button>
        </form>
      </div>

      <div className="bg-white border border-line/60 rounded-sm p-5">
        <div className="text-sm font-sans font-medium text-ink mb-3">Categories</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <span key={c.id} className="text-xs font-sans px-2.5 py-1 rounded-sm bg-paperdim text-textdark">{c.name}</span>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. Pet Care"
            className="flex-1 px-3 py-2 bg-white border border-line rounded-sm font-sans text-sm"
          />
          <button className="px-4 py-2 bg-ink text-paper rounded-sm text-sm font-sans">Add</button>
        </form>
      </div>
    </div>
  )
}
