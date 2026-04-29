import { useState } from 'react'
import { useDashboardData } from '@/hooks/useBoats'
import { StatusBar } from '@/components/layout/StatusBar'
import { BoatCard } from './BoatCard'
import { StartSession } from '@/screens/Session/StartSession'
import { StopSession } from '@/screens/Session/StopSession'
import { BOAT_TYPE_LABELS, ALL_BOAT_TYPES } from '@/constants'
import type { Boat, BoatType, BoatWithActiveSession } from '@/types'

export function Dashboard() {
  const { data: boats = [], isLoading, isError } = useDashboardData()
  const [startBoat, setStartBoat] = useState<Boat | null>(null)
  const [stopBoat, setStopBoat] = useState<BoatWithActiveSession | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<BoatType | ''>('')

  const usedTypes = ALL_BOAT_TYPES.filter(t => boats.some(b => b.type === t))

  const filtered = boats.filter(b => {
    const matchName = b.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === '' || b.type === typeFilter
    return matchName && matchType
  })

  const available    = filtered.filter(b => b.status === 'available')
  const onWater      = filtered.filter(b => b.status === 'on_water')
  const maintenance  = filtered.filter(b => b.status === 'maintenance')

  return (
    <div className="flex flex-col h-full">
      <StatusBar />

      <div className="flex gap-3 px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Søk på navn..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-club-blue"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as BoatType | '')}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-club-blue bg-white text-gray-700"
        >
          <option value="">Alle typer</option>
          {usedTypes.map(t => (
            <option key={t} value={t}>{BOAT_TYPE_LABELS[t]}</option>
          ))}
        </select>
        {(search || typeFilter) && (
          <button
            onClick={() => { setSearch(''); setTypeFilter('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Nullstill
          </button>
        )}
      </div>

      <main className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-club-blue" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Laster...
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            Kunne ikke hente data. Viser eventuelt lagret informasjon.
          </div>
        )}

        {!isLoading && (
          <div className="space-y-8">
            {/* On water */}
            {onWater.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  På vannet ({onWater.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {onWater.map(boat => (
                    <BoatCard
                      key={boat.id}
                      boat={boat}
                      onStartClick={setStartBoat}
                      onStopClick={setStopBoat}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Available */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Tilgjengelige ({available.length})
              </h2>
              {available.length === 0 ? (
                <p className="text-gray-400 text-sm">Ingen båter tilgjengelig for øyeblikket.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {available.map(boat => (
                    <BoatCard
                      key={boat.id}
                      boat={boat}
                      onStartClick={setStartBoat}
                      onStopClick={setStopBoat}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Maintenance */}
            {maintenance.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Vedlikehold ({maintenance.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {maintenance.map(boat => (
                    <BoatCard
                      key={boat.id}
                      boat={boat}
                      onStartClick={setStartBoat}
                      onStopClick={setStopBoat}
                    />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && !isLoading && boats.length > 0 && (
              <div className="text-center text-gray-400 py-16">
                <p>Ingen båter matcher søket.</p>
              </div>
            )}
            {boats.length === 0 && !isLoading && (
              <div className="text-center text-gray-400 py-16">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17l3-6 3 3 3-6 3 3 3-6" />
                </svg>
                <p>Ingen båter registrert ennå.</p>
                <p className="text-sm mt-1">Gå til Admin for å legge til båter.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {startBoat && (
        <StartSession
          boat={startBoat}
          onClose={() => setStartBoat(null)}
        />
      )}

      {stopBoat?.active_session && (
        <StopSession
          boat={stopBoat}
          session={stopBoat.active_session}
          onClose={() => setStopBoat(null)}
        />
      )}
    </div>
  )
}
