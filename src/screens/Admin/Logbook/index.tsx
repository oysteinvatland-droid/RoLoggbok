import { useState } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { formatDistanceStrict } from 'date-fns'
import { useSessionHistory } from '@/hooks/useSessions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { SessionWithDetails } from '@/types'

function exportCSV(sessions: SessionWithDetails[]) {
  const headers = [
    'Dato', 'Starttid', 'Sluttid', 'Varighet (min)',
    'Båt', 'Roere', 'Rute', 'Coachet', 'Hendelse', 'Kommentar',
  ]
  const rows = sessions.map(s => [
    format(new Date(s.start_time), 'dd.MM.yyyy'),
    format(new Date(s.start_time), 'HH:mm'),
    s.end_time ? format(new Date(s.end_time), 'HH:mm') : '',
    s.end_time
      ? String(Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000))
      : '',
    s.boat?.name ?? '',
    s.members.map(m => m.name).join('; '),
    s.route?.name ?? '',
    s.has_been_coached ? 'Ja' : 'Nei',
    s.incident?.description ?? '',
    s.comment ?? '',
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  // BOM for correct Norwegian characters in Excel
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `baatlogg-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function LogbookAdmin() {
  const { data: sessions = [], isLoading } = useSessionHistory()
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filtered = sessions.filter(s => {
    const text = [
      s.boat?.name,
      s.route?.name,
      s.comment,
      s.incident?.description,
      ...s.members.map(m => m.name),
    ].join(' ').toLowerCase()
    const matchSearch = !search || text.includes(search.toLowerCase())
    const matchFrom = !fromDate || new Date(s.start_time) >= new Date(fromDate)
    const matchTo   = !toDate   || new Date(s.start_time) <= new Date(toDate + 'T23:59:59')
    return matchSearch && matchFrom && matchTo
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Loggbok</h1>
        <Button variant="secondary" onClick={() => exportCSV(filtered)} disabled={filtered.length === 0}>
          Last ned CSV ({filtered.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          className="flex-1 min-w-48"
          placeholder="Søk etter båt, roer, rute..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Input
          type="date"
          label=""
          placeholder="Fra dato"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          className="w-44"
        />
        <Input
          type="date"
          label=""
          placeholder="Til dato"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          className="w-44"
        />
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Laster...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Ingen turer funnet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Dato / Tid</th>
                  <th className="text-left px-4 py-3">Båt</th>
                  <th className="text-left px-4 py-3">Roere</th>
                  <th className="text-left px-4 py-3">Rute</th>
                  <th className="text-left px-4 py-3">Varighet</th>
                  <th className="text-left px-4 py-3">Flagg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium">{format(new Date(s.start_time), 'dd.MM.yyyy')}</p>
                      <p className="text-gray-500">
                        {format(new Date(s.start_time), 'HH:mm', { locale: nb })}
                        {s.end_time && ` – ${format(new Date(s.end_time), 'HH:mm', { locale: nb })}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium">{s.boat?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.members.map(m => m.name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.route?.name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {s.end_time
                        ? formatDistanceStrict(new Date(s.start_time), new Date(s.end_time), { locale: nb })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {s.has_been_coached && <Badge variant="info" size="sm">Coachet</Badge>}
                        {s.incident && <Badge variant="warning" size="sm">Hendelse</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
