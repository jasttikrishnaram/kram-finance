// Detects likely-recurring expenses from transaction history:
// same category + similar amount, appearing in 3+ distinct months.
export function detectRecurring(txns, existingBills = []) {
  const expenses = txns.filter((t) => t.type === 'Expense' && t.categories?.name)
  const groups = {}

  for (const t of expenses) {
    const roundedAmount = Math.round(Number(t.amount) / 50) * 50
    const key = `${t.category_id}__${roundedAmount}`
    const monthKey = t.occurred_on?.slice(0, 7)
    if (!groups[key]) {
      groups[key] = { category: t.categories.name, category_id: t.category_id, amounts: [], months: new Set(), days: [], lastDate: t.occurred_on, note: t.note }
    }
    groups[key].amounts.push(Number(t.amount))
    groups[key].months.add(monthKey)
    groups[key].days.push(Number(t.occurred_on?.slice(8, 10)))
    if (t.occurred_on > groups[key].lastDate) groups[key].lastDate = t.occurred_on
  }

  const existingKeys = new Set(
    existingBills.map((b) => `${Math.round(Number(b.amount) / 50) * 50}`)
  )

  const suggestions = Object.values(groups)
    .filter((g) => g.months.size >= 3)
    .filter((g) => !existingKeys.has(`${Math.round((g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length) / 50) * 50}`))
    .map((g) => {
      const avgAmount = Math.round(g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length)
      const dayFreq = {}
      g.days.forEach((d) => { dayFreq[d] = (dayFreq[d] || 0) + 1 })
      const commonDay = Number(Object.entries(dayFreq).sort((a, b) => b[1] - a[1])[0][0])
      return {
        category: g.category,
        category_id: g.category_id,
        avgAmount,
        monthsSeen: g.months.size,
        commonDay,
        note: g.note,
        lastDate: g.lastDate,
      }
    })
    .sort((a, b) => b.monthsSeen - a.monthsSeen)

  return suggestions
}
