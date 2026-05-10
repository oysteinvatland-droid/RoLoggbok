import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { useSessionHistory } from '@/hooks/useSessions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type ViewMode = 'rower' | 'boat'

interface DistanceRow {
  id: string
  name: string
  trips: number
  totalKm: number
}

function exportCSV(rows: DistanceRow[], viewMode: ViewMode, fromDate: string, toDate: string) {
  const label = viewMode === 'rower' ? 'Roer' : 'Båt'
  const headers = [label, 'Antall turer', 'Totaldistanse (km)']
  const dataRows = rows.map(r => [r.name, String(r.trips), r.totalKm.toFixed(1)])
  const grandTrips = rows.reduce((s, r) => s + r.trips, 0)
  const grandTotal = rows.reduce((s, r) => s + r.totalKm, 0)
  dataRows.push(['Totalt', String(grandTrips), grandTotal.toFixed(1)])

  const csv = [headers, ...dataRows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const period = `${fromDate || 'start'}_${toDate || 'slutt'}`
  a.download = `distanser-${viewMode === 'rower' ? 'roere' : 'baater'}-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function DistancesAdmin() {
  const currentYear = new Date().getFullYear()
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`)
  const [toDate, setToDate] = useState(`${currentYear}-12-31`)
  const [viewMode, setViewMode] = useState<ViewMode>('rower')
  const [filterId, setFilterId] = useState<string>('all')

  const { data: sessions = [], isLoading } = useSessionHistory()

  const inRange = useMemo(() => sessions.filter(s => {
    if (!s.end_time || s.distance_km == null) return false
    const t = new Date(s.end_time).getTime()
    const from = fromDate ? new Date(fromDate).getTime() : -Infinity
    const to = toDate ? new Date(toDate + 'T23:59:59').getTime() : Infinity
    return t >= from && t <= to
  }), [sessions, fromDate, toDate])

  const rows = useMemo((): DistanceRow[] => {
    const map = new Map<string, DistanceRow>()

    if (viewMode === 'rower') {
      for (const s of inRange) {
        for (const m of s.members) {
          const existing = map.get(m.id)
          if (existing) {
            existing.trips++
            existing.totalKm += s.distance_km!
          } else {
            map.set(m.id, { id: m.id, name: m.name, trips: 1, totalKm: s.distance_km! })
          }
        }
      }
    } else {
      for (const s of inRange) {
        const boat = s.boat
        if (!boat) continue
        const existing = map.get(boat.id)
        if (existing) {
          existing.trips++
          existing.totalKm += s.distance_km!
        } else {
          map.set(boat.id, { id: boat.id, name: boat.name, trips: 1, totalKm: s.distance_km! })
        }
      }
    }

    return [...map.values()].sort((a, b) => b.totalKm - a.totalKm)
  }, [inRange, viewMode])

  const filterOptions = useMemo(() => rows.map(r => ({ id: r.id, name: r.name })), [rows])

  const displayed = filterId === 'all' ? rows : rows.filter(r => r.id === filterId)

  const grandTotal = displayed.reduce((sum, r) => sum + r.totalKm, 0)
  const grandTrips = displayed.reduce((sum, r) => sum + r.trips, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Distanser</h1>
        <Button
          variant="secondary"
          onClick={() => exportCSV(displayed, viewMode, fromDate, toDate)}
          disabled={displayed.length === 0}
        >
          Last ned CSV ({displayed.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <Input
          label="Fra dato"
          type="date"
          value={fromDate}
          onChange={e => { setFromDate(e.target.value); setFilterId('all') }}
          className="w-44"
        />
        <Input
          label="Til dato"
          type="date"
          value={toDate}
          onChange={e => { setToDate(e.target.value); setFilterId('all') }}
          className="w-44"
        />

        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden self-end">
          {(['rower', 'boat'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setFilterId('all') }}
              className={`px-4 py-2 text-sm font-medium transition ${
                viewMode === mode
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {mode === 'rower' ? 'Per roer' : 'Per båt'}
            </button>
          ))}
        </div>

        {/* Filter select */}
        {filterOptions.length > 0 && (
          <div className="self-end">
            <select
              value={filterId}
              onChange={e => setFilterId(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-club-blue"
            >
              <option value="all">Alle</option>
              {filterOptions.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Laster...</p>
      ) : displayed.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          Ingen turer med registrert distanse i valgt periode.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">{viewMode === 'rower' ? 'Roer' : 'Båt'}</th>
                <th className="text-right px-4 py-3">Turer</th>
                <th className="text-right px-4 py-3">Totaldistanse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{r.trips}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {r.totalKm.toFixed(1)} km
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-700">Totalt</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700">{grandTrips}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{grandTotal.toFixed(1)} km</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
