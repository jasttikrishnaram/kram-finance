export function transactionsToCSV(txns) {
  const headers = ['Date', 'Type', 'Account', 'Category', 'Amount', 'Payment Mode', 'Note']
  const rows = txns.map((t) => [
    t.occurred_on,
    t.type,
    t.accounts?.name || '',
    t.categories?.name || '',
    t.amount,
    t.payment_mode || '',
    (t.note || '').replace(/"/g, '""'),
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '')}"`).join(','))
    .join('\n')
  return csv
}

export function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
