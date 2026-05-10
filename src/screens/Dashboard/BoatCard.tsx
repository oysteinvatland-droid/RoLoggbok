import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { formatDistanceStrict, format } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { Boat, BoatWithActiveSession } from '@/types'
import { BOAT_STATUS_LABELS } from '@/constants'
import { Button } from '@/components/ui/Button'

interface BoatCardProps {
  boat: BoatWithActiveSession
  onStartClick: (boat: Boat) => void
  onStopClick: (boat: BoatWithActiveSession) => void
}

function ElapsedTime({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const update = () =>
      setElapsed(formatDistanceStrict(new Date(startTime), new Date(), { locale: nb }))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [startTime])

  return <span>{elapsed}</span>
}

export function BoatCard({ boat, onStartClick, onStopClick }: BoatCardProps) {
  const session = boat.active_session
  const isOnWater = boat.status === 'on_water' && session
  const isMaintenance = boat.status === 'maintenance'
  const isAway = boat.status === 'away'

  const estimatedEnd = session?.estimated_end_time
  const isOverdue = estimatedEnd ? new Date(estimatedEnd) < new Date() : false

  return (
    <div
      className={clsx(
        'rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all',
        {
          'border-green-400 bg-green-50': boat.status === 'available',
          'border-club-blue bg-blue-50':  isOnWater && !isOverdue,
          'border-amber-400 bg-amber-50': isOnWater && isOverdue,
          'border-gray-300 bg-gray-100 opacity-60': isMaintenance,
          'border-purple-400 bg-purple-50 opacity-70': isAway,
        }
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-lg text-gray-900 leading-tight">{boat.name}</h3>
          <p className="text-sm text-gray-500">
            {boat.boat_type?.name ?? ''}
            {boat.boat_number && <span className="ml-2 text-gray-400">#{boat.boat_number}</span>}
          </p>
        </div>
        <span
          className={clsx('text-xs font-medium px-2 py-1 rounded-full shrink-0', {
            'bg-green-200 text-green-800':   boat.status === 'available',
            'bg-blue-200 text-blue-800':   isOnWater && !isOverdue,
            'bg-amber-200 text-amber-800': isOnWater && isOverdue,
            'bg-gray-200 text-gray-600':   isMaintenance,
            'bg-purple-200 text-purple-800': isAway,
          })}
        >
          {BOAT_STATUS_LABELS[boat.status]}
        </span>
      </div>

      {/* Active session info */}
      {isOnWater && session && (
        <div className="text-sm text-gray-700 space-y-1">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <ElapsedTime startTime={session.start_time} />
            {isOverdue && <span className="text-amber-600 font-medium">— forsinket</span>}
          </div>
          {session.members.length > 0 && (
            <div className="flex items-start gap-1.5">
              <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="leading-snug">
                {session.members.map(m => m.name).join(', ')}
              </span>
            </div>
          )}
          {session.route && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>{session.route.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {boat.notes && (
        <p className="text-sm text-gray-500 italic">{boat.notes}</p>
      )}

      {/* Away info */}
      {isAway && (
        <p className="text-sm text-purple-700">
          {boat.available_from
            ? `Tilbake: ${format(new Date(boat.available_from + 'T00:00:00'), 'd. MMMM yyyy', { locale: nb })}`
            : 'Tilbakekomst ukjent'}
        </p>
      )}

      {/* Action button */}
      {!isMaintenance && !isAway && (
        <div className="mt-auto pt-2">
          {boat.status === 'available' ? (
            <Button
              size="xl"
              variant="primary"
              className="w-full"
              onClick={() => onStartClick(boat)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start tur
            </Button>
          ) : (
            <Button
              size="xl"
              variant="secondary"
              className={clsx('w-full', isOverdue && 'border-amber-400 text-amber-700 hover:bg-amber-50')}
              onClick={() => onStopClick(boat)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Avslutt tur
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
