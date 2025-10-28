import React from 'react'

type TX = {
  id: string
  amount: number
  currency: string
  createdAt: string
  customerEmail?: string
  status?: string
}

export default function TransactionsTable({ data }: { data: TX[] }) {
  return (
    <div className="w-full bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <div className="text-sm text-zinc-300 font-medium mb-3">Recent transactions</div>
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs">
              <th className="pb-2">ID</th>
              <th className="pb-2">Customer</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id} className="border-t border-zinc-800">
                <td className="py-3 text-zinc-300">{t.id}</td>
                <td className="py-3 text-zinc-300">{t.customerEmail ?? '-'}</td>
                <td className="py-3 text-zinc-200">{(t.amount / 100).toFixed(2)} {t.currency}</td>
                <td className="py-3 text-zinc-400">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="py-3"><span className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-300">{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
