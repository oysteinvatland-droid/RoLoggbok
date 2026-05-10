import { useState } from 'react'
import { format, addMinutes } from 'date-fns'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useMembers } from '@/hooks/useMembers'
import { useRoutes } from '@/hooks/useBoats'
import { useStartSession } from '@/hooks/useSessions'
import { useToast } from '@/components/ui/Toast'
import { clsx } from 'clsx'
import type { Boat, Member } from '@/types'

type Step = 'rowers' | 'route' | 'time' | 'review'

const DURATION_OPTIONS = [
  { value: 0,   label: 'Ingen estimat' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 time' },
  { value: 90,  label: '1 t 30 min' },
  { value: 120, label: '2 timer' },
  { value: 180, label: '3 timer' },
]

interface Props {
  boat: Boat
  onClose: () => void
}

export function StartSession({ boat, onClose }: Props) {
  const crewSize = boat.boat_type?.crew_size ?? 1

  const [step, setStep] = useState<Step>('rowers')
  const [seatSelections, setSeatSelections] = useState<(string | null)[]>(() => Array(crewSize).fill(null))
  const [seatSearches, setSeatSearches] = useState<string[]>(() => Array(crewSize).fill(''))
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [comment, setComment] = useState('')

  const { data: members = [] } = useMembers()
  const { data: routes = [] } = useRoutes()
  const startMutation = useStartSession()
  const { toast } = useToast()

  const selectedMemberIds = seatSelections.filter((id): id is string => id !== null)
  const allSeatsSelected = seatSelections.every(id => id !== null)

  function selectMember(seatIndex: number, memberId: string) {
    setSeatSelections(prev => prev.map((v, j) => j === seatIndex ? memberId : v))
    setSeatSearches(prev => prev.map((v, j) => j === seatIndex ? '' : v))
  }

  function clearSeat(seatIndex: number) {
    setSeatSelections(prev => prev.map((v, j) => j === seatIndex ? null : v))
  }

  function updateSearch(seatIndex: number, value: string) {
    setSeatSearches(prev => prev.map((v, j) => j === seatIndex ? value : v))
  }

  async function handleConfirm() {
    const startDate = new Date(startTime)
    const estimated = durationMinutes > 0
      ? addMinutes(startDate, durationMinutes).toISOString()
      : null

    try {
      await startMutation.mutateAsync({
        boat_id: boat.id,
        member_ids: selectedMemberIds,
        route_id: selectedRouteId,
        start_time: startDate.toISOString(),
        estimated_end_time: estimated,
        comment,
      })
      toast('Tur startet!')
      onClose()
    } catch {
      toast('Feil ved oppstart av tur', 'error')
    }
  }

  const steps: Step[] = ['rowers', 'route', 'time', 'review']
  const stepIndex = steps.indexOf(step)

  const stepTitles: Record<Step, string> = {
    rowers: 'Velg roere',
    route:  'Velg rute',
    time:   'Tidspunkt',
    review: 'Bekreft',
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Start tur — ${boat.name}`}
      size="lg"
      footer={
        <>
          {step !== 'rowers' && (
            <Button variant="ghost" onClick={() => setStep(steps[stepIndex - 1])}>
              Tilbake
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Avbryt</Button>
          {step !== 'review' ? (
            <Button
              variant="primary"
              disabled={step === 'rowers' && !allSeatsSelected}
              onClick={() => setStep(steps[stepIndex + 1])}
            >
              Neste →
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              loading={startMutation.isPending}
              onClick={handleConfirm}
            >
              Start tur
            </Button>
          )}
        </>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold',
              i < stepIndex  ? 'bg-club-blue text-white' :
              i === stepIndex ? 'bg-club-navy text-white' :
              'bg-gray-200 text-gray-500'
            )}>
              {i < stepIndex ? '✓' : i + 1}
            </div>
            <span className={clsx('text-sm', i === stepIndex ? 'font-medium text-gray-900' : 'text-gray-400')}>
              {stepTitles[s]}
            </span>
            {i < steps.length - 1 && <div className="w-4 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step: Rowers */}
      {step === 'rowers' && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${Math.min(crewSize, 4)}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: crewSize }, (_, i) => {
            const selectedId = seatSelections[i]
            const selectedMember: Member | undefined = selectedId ? members.find(m => m.id === selectedId) : undefined
            const takenIds = new Set(seatSelections.filter((id, j): id is string => id !== null && j !== i))
            const filtered = members.filter(m =>
              !takenIds.has(m.id) &&
              m.name.toLowerCase().includes(seatSearches[i].toLowerCase())
            )

            return (
              <div key={i} className="flex flex-col gap-2 min-w-0">
                <p className="text-sm font-semibold text-gray-700">Roer {i + 1}</p>

                {selectedMember ? (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-blue-50 border-2 border-club-blue rounded-xl">
                    <span className="font-medium text-club-navy text-sm truncate">{selectedMember.name}</span>
                    <button
                      type="button"
                      onClick={() => clearSeat(i)}
                      className="ml-2 text-gray-400 hover:text-gray-700 text-xl leading-none shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Søk etter navn..."
                      value={seatSearches[i]}
                      onChange={e => updateSearch(i, e.target.value)}
                    />
                    <div className="space-y-1 max-h-52 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">Ingen funnet</p>
                      ) : filtered.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectMember(i, m.id)}
                          className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-200 hover:border-club-blue hover:bg-blue-50 text-sm font-medium transition"
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Step: Route */}
      {step === 'route' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-4">Valgfritt — hopp over hvis ingen fast rute.</p>
          <button
            onClick={() => setSelectedRouteId(null)}
            className={clsx(
              'w-full px-4 py-3 rounded-xl border-2 text-left transition font-medium',
              !selectedRouteId
                ? 'border-club-blue bg-blue-50 text-club-navy'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            Ingen rute
          </button>
          {routes.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              className={clsx(
                'w-full px-4 py-3 rounded-xl border-2 text-left transition',
                selectedRouteId === r.id
                  ? 'border-club-blue bg-blue-50 text-club-navy'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <span className="font-medium">{r.name}</span>
              {r.distance_km && (
                <span className="ml-2 text-sm text-gray-500">{r.distance_km} km</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Step: Time */}
      {step === 'time' && (
        <div className="space-y-5">
          <Input
            label="Starttidspunkt"
            type="datetime-local"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Estimert varighet</label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDurationMinutes(opt.value)}
                  className={clsx(
                    'px-3 py-2 rounded-lg border-2 text-sm font-medium transition',
                    durationMinutes === opt.value
                      ? 'border-club-blue bg-blue-50 text-club-navy'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Kommentar (valgfritt)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Eventuelle merknader..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-club-blue resize-none"
            />
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <Row label="Båt" value={boat.name} />
            <Row label="Type" value={boat.boat_type?.name ?? ''} />
            <Row
              label="Roere"
              value={
                selectedMemberIds.length === 0
                  ? 'Ingen valgt'
                  : seatSelections
                      .map((id, i) => {
                        const name = members.find(m => m.id === id)?.name ?? '—'
                        return `${i + 1}. ${name}`
                      })
                      .join(', ')
              }
            />
            <Row
              label="Rute"
              value={routes.find(r => r.id === selectedRouteId)?.name ?? 'Ingen'}
            />
            <Row label="Starttid" value={format(new Date(startTime), 'dd.MM.yyyy HH:mm')} />
            <Row
              label="Estimert varighet"
              value={DURATION_OPTIONS.find(d => d.value === durationMinutes)?.label ?? '—'}
            />
            {comment && <Row label="Kommentar" value={comment} />}
          </div>
        </div>
      )}
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}
