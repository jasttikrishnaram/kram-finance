import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions, fetchAccounts, fetchBills } from '../lib/data'
import { formatINR, currentPeriod, monthLabel } from '../lib/format'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#C08A2E', '#3F7D58', '#B0473C', '#5B6560', '#E4B865', '#7A8C82', '#8C6A3F', '#4A5D52']

export default function Dashboard() {
  const [period, setPeriod] = useState(currentPeriod())
  const [txns, setTxns] = useState([])
  const [accounts, setAccounts] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTransactions({ month: period, limit: 2000 }), fetchAccounts(), fetchBills()])
      .then(([t, a, b]) => { setTxns(t); setAccounts(a); setBills(b) })
      .finally(() => setLoading(false))
  }, [period])

  const stats = useMemo(() => {
    let income = 0, expense = 0
    const byCategory = {}
    for (const t of txns) {
      if (t.type === 'Income') income += Number(t.amount)
      if (t.type === 'Expense') {
        expense += Number(t.amount)
        const name = t.categories?.name || 'Others'
        byCategory[name] = (byCategory[name] || 0) + Number(t.amount)
      }
    }
    const net = income - expense
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))
    return { income, expense, net, savingsRate, topCategories }
  }, [txns])

  const ccStats = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'credit_card')
      .map((cc) => {
        const spent = txns.filter((t) => t.account_id === cc.id && t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0)
        const util = cc.credit_limit ? Math.round((spent / cc.credit_limit) * 100) : null
        return { ...cc, spent, util }
      })
  }, [accounts, txns])

  const today = new Date().getDate()
  const upcomingBills = bills.filter((b) => b.due_day >= today).sort((a, b) => a.due_day - b.due_day).slice(0, 4)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-textmuted text-sm font-sans">{monthLabel(period)}</div>
          <div className="font-display text-5xl text-ink mt-1 tabular">
            {loading ? '—' : formatINR(stats.net)}
          </div>
          <div className="text-textmuted text-sm mt-1 font-sans">net this month</div>
        </div>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-line rounded-sm px-3 py-1.5 text-sm bg-white font-sans"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Income" value={formatINR(stats.income)} tone="positive" />
        <StatCard label="Expense" value={formatINR(stats.expense)} tone="negative" />
        <StatCard label="Savings rate" value={`${stats.savingsRate}%`} tone={stats.savingsRate >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-line/60 rounded-sm p-5">
          <div className="text-sm font-sans font-medium text-ink mb-3">Top categories</div>
          {stats.topCategories.length === 0 ? (
            <div className="text-textmuted text-sm font-sans">No expenses logged yet this month.</div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.topCategories} dataKey="value" nameKey="name" innerRadius={28} outerRadius={50}>
                      {stats.topCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {stats.topCategories.map((c, i) => (
                  <div key={c.name} className="flex justify-between text-sm font-sans">
                    <span className="flex items-center gap-2 text-textdark">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {c.name}
                    </span>
                    <span className="tabular text-textmuted">{formatINR(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-line/60 rounded-sm p-5">
          <div className="text-sm font-sans font-medium text-ink mb-3">Credit cards</div>
          {ccStats.length === 0 ? (
            <div className="text-textmuted text-sm font-sans">No credit cards added yet.</div>
          ) : (
            <div className="space-y-3">
              {ccStats.map((cc) => (
                <div key={cc.id}>
                  <div className="flex justify-between text-sm font-sans mb-1">
                    <span>{cc.name}</span>
                    <span className="tabular text-textmuted">{formatINR(cc.spent)}{cc.credit_limit ? ` / ${formatINR(cc.credit_limit)}` : ''}</span>
                  </div>
                  {cc.util !== null && (
                    <div className="h-1.5 bg-paperdim rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cc.util > 80 ? 'bg-negative' : cc.util > 50 ? 'bg-gold' : 'bg-positive'}`}
                        style={{ width: `${Math.min(cc.util, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-line/60 rounded-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-sans font-medium text-ink">Upcoming bills</div>
          <Link to="/bills" className="text-xs text-gold font-sans hover:underline">View all</Link>
        </div>
        {upcomingBills.length === 0 ? (
          <div className="text-textmuted text-sm font-sans">Nothing due for the rest of this month.</div>
        ) : (
          <div className="divide-y divide-line/40">
            {upcomingBills.map((b) => (
              <div key={b.id} className="flex justify-between py-2 text-sm font-sans">
                <span>{b.name}</span>
                <span className="tabular text-textmuted">Due {b.due_day} · {formatINR(b.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          to="/transactions?new=1"
          className="bg-ink text-paper px-5 py-2.5 rounded-sm text-sm font-sans font-medium hover:bg-inkdeep transition-colors"
        >
          Add transaction
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const toneClass = tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-ink'
  return (
    <div className="bg-white border border-line/60 rounded-sm p-4">
      <div className="text-xs text-textmuted font-sans uppercase tracking-wide mb-1">{label}</div>
      <div className={`font-display text-2xl tabular ${toneClass}`}>{value}</div>
    </div>
  )
}
