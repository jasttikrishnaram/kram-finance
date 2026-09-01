import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions, fetchAccounts } from '../lib/data'
import { formatINR } from '../lib/format'

export default function Insights() {
  const [txns, setTxns] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchTransactions({ limit: 5000 }), fetchAccounts()])
      .then(([t, a]) => { setTxns(t); setAccounts(a) })
      .finally(() => setLoading(false))
  }, [])

  const insights = useMemo(() => {
    let income = 0, expense = 0
    const byCategory = {}
    const byAccount = {}
    for (const t of txns) {
      const amt = Number(t.amount)
      if (t.type === 'Income') income += amt
      if (t.type === 'Expense') {
        expense += amt
        const cat = t.categories?.name || 'Others'
        byCategory[cat] = (byCategory[cat] || 0) + amt
        const acct = t.accounts?.name || 'Unknown'
        byAccount[acct] = (byAccount[acct] || 0) + amt
      }
    }
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
    const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
    const alerts = []
    for (const [cat, amt] of topCats.slice(0, 3)) {
      if (income > 0) {
        const pct = Math.round((amt / income) * 100)
        if (pct >= 15) alerts.push(`${cat} is ${pct}% of your total income (${formatINR(amt)}).`)
      }
    }
    const ccAccounts = accounts.filter((a) => a.type === 'credit_card')
    for (const cc of ccAccounts) {
      const spent = byAccount[cc.name] || 0
      if (cc.credit_limit && spent / cc.credit_limit > 0.7) {
        alerts.push(`${cc.name} utilization is high: ${formatINR(spent)} of ${formatINR(cc.credit_limit)}.`)
      }
    }
    if (savingsRate < 10 && income > 0) alerts.push(`Savings rate is ${savingsRate}% — below the healthy 20% benchmark.`)

    return { income, expense, savingsRate, topCats, byAccount, alerts }
  }, [txns, accounts])

  if (loading) return <div className="text-textmuted font-sans text-sm">Loading…</div>

  return (
    <div>
      <div className="font-display text-3xl text-ink mb-6">Insights</div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <MiniStat label="All-time income" value={formatINR(insights.income)} />
        <MiniStat label="All-time expense" value={formatINR(insights.expense)} />
        <MiniStat label="Savings rate" value={`${insights.savingsRate}%`} />
      </div>

      {insights.alerts.length > 0 && (
        <div className="bg-white border border-line/60 rounded-sm p-5 mb-8">
          <div className="text-sm font-sans font-medium text-ink mb-3">Alerts</div>
          <ul className="space-y-2">
            {insights.alerts.map((a, i) => (
              <li key={i} className="text-sm font-sans text-textdark flex gap-2">
                <span className="text-gold">·</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white border border-line/60 rounded-sm p-5 mb-8">
        <div className="text-sm font-sans font-medium text-ink mb-3">Spending by category (all-time)</div>
        <div className="divide-y divide-line/40">
          {insights.topCats.map(([cat, amt]) => (
            <div key={cat} className="flex justify-between py-2 text-sm font-sans">
              <span>{cat}</span>
              <span className="tabular text-textmuted">{formatINR(amt)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-line/60 rounded-sm p-5">
        <div className="text-sm font-sans font-medium text-ink mb-3">Spending by account</div>
        <div className="divide-y divide-line/40">
          {Object.entries(insights.byAccount).sort((a, b) => b[1] - a[1]).map(([acct, amt]) => (
            <div key={acct} className="flex justify-between py-2 text-sm font-sans">
              <span>{acct}</span>
              <span className="tabular text-textmuted">{formatINR(amt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white border border-line/60 rounded-sm p-4">
      <div className="text-xs text-textmuted font-sans uppercase tracking-wide mb-1">{label}</div>
      <div className="font-display text-xl text-ink tabular">{value}</div>
    </div>
  )
}
