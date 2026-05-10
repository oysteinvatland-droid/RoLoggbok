import { useState } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { formatDistanceStrict } from 'date-fns'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useStopSession } from '@/hooks/useSessions'
import { useToast } from '@/components/ui/Toast'
import type { Boat, SessionWithDetails } from '@/types'

interface Props {
  boat: Boat
  session: SessionWithDetails
  onClose: () => void
}

export function StopSession({ boat, session, onClose }: Props) {
  const [endTime, setEndTime] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [coached, setCoached] = useState(false)
  const [reportIncident, setReportIncident] = useState(false)
  const [incidentDesc, setIncidentDesc] = useState('')
  const [distanceKm, setDistanceKm] = useState('')

  const stopMutation = useStopSession()
  const { toast } = useToast()

  const duration = formatDistanceStrict(
    new Date(session.start_time),
    new Date(),
    { locale: nb }
  )

  async function handleStop() {
    if (reportIncident && incidentDesc.trim().length < 5) {
      toast('Beskriv hendelsen (minst 5 tegn)', 'error')
      return
    }
    try {
      await stopMutation.mutateAsync({
        session_id: session.id,
        end_time: new Date(endTime).toISOString(),
        has_been_coached: coached,
        incident_description: reportIncident ? incidentDesc.trim() : null,
        boat_id: boat.id,
        distance_km: distanceKm ? parseFloat(distanceKm) : null,
      })
      toast('Tur avsluttet!')
      onClose()
    } catch {
      toast('Feil ved avslutning av tur', 'error')
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Avslutt tur — ${boat.name}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Avbryt</Button>
          <Button
            variant="primary"
            size="lg"
            loading={stopMutation.isPending}
            onClick={handleStop}
          >
            Avslutt tur
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Session summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
          <p><span className="text-gray-500">Roere: </span>
            <span className="font-medium">
              {session.members.map(m => m.name).join(', ') || '—'}
            </span>
          </p>
          <p><span className="text-gray-500">Startet: </span>
            <span className="font-medium">
              {format(new Date(session.start_time), 'dd.MM.yyyy HH:mm', { locale: nb })}
            </span>
          </p>
          <p><span className="text-gray-500">Varighet: </span>
            <span className="font-medium">{duration}</span>
          </p>
          {session.route && (
            <p><span className="text-gray-500">Rute: </span>
              <span className="font-medium">{session.route.name}</span>
            </p>
          )}
        </div>

        <Input
          label="Sluttidspunkt"
          type="datetime-local"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
        />

        <Input
          label="Distanse (km)"
          type="number"
          min="0"
          step="0.1"
          placeholder="f.eks. 12.5"
          value={distanceKm}
          onChange={e => setDistanceKm(e.target.value)}
        />

        {/* Coached toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            onClick={() => setCoached(c => !c)}
            className={`w-12 h-6 rounded-full transition-colors ${coached ? 'bg-club-blue' : 'bg-gray-300'}`}
            role="switch"
            aria-checked={coached}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${coached ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">Turen ble coachet</span>
        </label>

        {/* Incident */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reportIncident}
              onChange={e => setReportIncident(e.target.checked)}
              className="w-5 h-5 rounded text-club-blue"
            />
            <span className="text-sm font-medium text-gray-700">Registrer hendelse / skade</span>
          </label>
          {reportIncident && (
            <textarea
              value={incidentDesc}
              onChange={e => setIncidentDesc(e.target.value)}
              rows={3}
              placeholder="Beskriv hva som skjedde..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-club-blue resize-none"
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
