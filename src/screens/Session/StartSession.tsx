import { useState, useMemo } from 'react'
import { format, addMinutes } from 'date-fns'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useMembers } from '@/hooks/useMembers'
import { useRoutes } from '@/hooks/useBoats'
import { useStartSession } from '@/hooks/useSessions'
import { useToast } from '@/components/ui/Toast'
import { BOAT_TYPE_LABELS, BOAT_TYPE_CREW_SIZE } from '@/constants'
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
  const [step, setStep] = useState<Step>('rowers')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [startTime] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [comment, setComment] = useState('')
  const [search, setSearch] = useState('')

  const { data: members = [] } = useMembers()
  const { data: routes = [] } = useRoutes()
  const startMutation = useStartSession()
  const { toast } = useToast()

  const crewSize = BOAT_TYPE_CREW_SIZE[boat.type]
  const crewHint = crewSize > 0 ? `${crewSize} roer${crewSize !== 1 ? 'e' : ''}` : ''

  const filtered = useMemo(
    () => members.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase())
    ),
    [members, search]
  )

  function toggleMember(id: string) {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
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
      size="md"
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
              disabled={step === 'rowers' && selectedMemberIds.length === 0}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedMemberIds.length} valgt
              {crewHint && ` · anbefalt: ${crewHint}`}
            </p>
          </div>
          <Input
            placeholder="Søk etter navn..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Ingen roere funnet.</p>
            )}
            {filtered.map((m: Member) => {
              const selected = selectedMemberIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition',
                    selected
                      ? 'border-club-blue bg-blue-50 text-club-navy'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className={clsx(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                    selected ? 'border-club-blue bg-club-blue' : 'border-gray-300'
                  )}>
                    {selected && <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>}
                  </div>
                  <span className="font-medium">{m.name}</span>
                </button>
              )
            })}
          </div>
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
            defaultValue={startTime}
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
            <Row label="Type" value={BOAT_TYPE_LABELS[boat.type]} />
            <Row
              label="Roere"
              value={
                selectedMemberIds.length === 0
                  ? 'Ingen valgt'
                  : members
                      .filter(m => selectedMemberIds.includes(m.id))
                      .map(m => m.name)
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
