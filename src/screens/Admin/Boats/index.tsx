import { useState } from 'react'
import { useAllBoats, useCreateBoat, useUpdateBoat, useTeams } from '@/hooks/useBoats'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useBoatTypes } from '@/hooks/useBoats'
import { BOAT_STATUS_LABELS } from '@/constants'
import type { Boat, BoatStatus } from '@/types'

const STATUS_BADGE: Record<BoatStatus, 'success' | 'info' | 'warning'> = {
  available: 'success', on_water: 'info', maintenance: 'warning', away: 'warning',
}

interface BoatFormValues {
  name: string
  boat_type_id: string
  status: BoatStatus
  boat_number: string
  notes: string
  available_from: string
  team_id: string
  secondary_team_id: string
}

const DEFAULT_FORM: BoatFormValues = {
  name: '',
  boat_type_id: '',
  status: 'available',
  boat_number: '',
  notes: '',
  available_from: '',
  team_id: '',
  secondary_team_id: '',
}

function teamLabel(b: Boat): string {
  if (!b.team) return ''
  if (b.secondary_team) return `${b.team.name} (${b.secondary_team.name})`
  return b.team.name
}

export function BoatAdmin() {
  const { data: boats = [], isLoading } = useAllBoats()
  const { data: boatTypes = [] } = useBoatTypes()
  const { data: teams = [] } = useTeams()
  const createBoat = useCreateBoat()
  const updateBoat = useUpdateBoat()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [modalBoat, setModalBoat] = useState<Boat | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<BoatFormValues>(DEFAULT_FORM)

  const filtered = boats.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase())
    const matchArchived = showArchived ? true : !b.archived_at
    return matchSearch && matchArchived
  })

  function openEdit(b: Boat) {
    setModalBoat(b)
    setForm({
      name: b.name,
      boat_type_id: b.boat_type_id,
      status: b.status,
      boat_number: b.boat_number ?? '',
      notes: b.notes ?? '',
      available_from: b.available_from ?? '',
      team_id: b.team_id ?? '',
      secondary_team_id: b.secondary_team_id ?? '',
    })
    setShowNew(false)
  }

  function openNew() {
    setModalBoat(null)
    setForm({ ...DEFAULT_FORM, boat_type_id: boatTypes[0]?.id ?? '' })
    setShowNew(true)
  }

  async function handleSave() {
    if (!form.team_id) {
      toast('Velg hvem som bruker båten', 'error')
      return
    }
    if (form.secondary_team_id && form.secondary_team_id === form.team_id) {
      toast('"Brukes av" og "Kan brukes av" kan ikke være like', 'error')
      return
    }
    try {
      const payload = {
        name: form.name,
        boat_type_id: form.boat_type_id,
        status: form.status,
        boat_number: form.boat_number || null,
        notes: form.notes || null,
        available_from: form.status === 'away' && form.available_from ? form.available_from : null,
        team_id: form.team_id || null,
        secondary_team_id: form.secondary_team_id || null,
      }
      if (modalBoat) {
        await updateBoat.mutateAsync({ id: modalBoat.id, ...payload })
        toast('Båt oppdatert')
      } else {
        await createBoat.mutateAsync({
          ...payload,
          min_age_category: null,
          min_seriousness: null,
          archived_at: null,
        })
        toast('Båt lagt til')
      }
      setModalBoat(null)
      setShowNew(false)
      setForm(DEFAULT_FORM)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  async function handleArchive(b: Boat) {
    const isArchived = !!b.archived_at
    await updateBoat.mutateAsync({
      id: b.id,
      archived_at: isArchived ? null : new Date().toISOString(),
    })
    toast(isArchived ? 'Båt gjenopprettet' : 'Båt arkivert')
  }

  const isPending = createBoat.isPending || updateBoat.isPending

  const primaryTeamOptions = teams.map(t => ({ value: t.id, label: t.name }))
  const secondaryTeamOptions = [
    { value: '', label: '— Ingen —' },
    ...teams.filter(t => t.id !== form.team_id).map(t => ({ value: t.id, label: t.name })),
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Båter</h1>
        <Button onClick={openNew}>+ Ny båt</Button>
      </div>

      <div className="flex gap-3">
        <Input
          className="flex-1"
          placeholder="Søk etter navn..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
            className="w-4 h-4"
          />
          Vis arkiverte
        </label>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Laster...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-gray-400">Ingen båter funnet.</p>
          )}
          {filtered.map(b => (
            <div key={b.id} className={`flex items-center gap-4 px-4 py-3 ${b.archived_at ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {b.name}
                  {b.boat_number && <span className="ml-2 text-gray-400 font-normal text-sm">#{b.boat_number}</span>}
                </p>
                <p className="text-sm text-gray-500">
                  {[b.boat_type?.name, teamLabel(b)].filter(Boolean).join(' · ')}
                </p>
                {b.notes && <p className="text-xs text-gray-400 truncate">{b.notes}</p>}
                {b.status === 'away' && b.available_from && (
                  <p className="text-xs text-purple-600">Tilbake: {new Date(b.available_from + 'T00:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
              </div>
              <Badge variant={STATUS_BADGE[b.status]} size="sm">
                {BOAT_STATUS_LABELS[b.status]}
              </Badge>
              {b.archived_at && <Badge variant="neutral" size="sm">Arkivert</Badge>}
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>Rediger</Button>
                <Button variant="ghost" size="sm" onClick={() => handleArchive(b)}>
                  {b.archived_at ? 'Gjenopprett' : 'Arkiver'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNew || !!modalBoat}
        onClose={() => { setModalBoat(null); setShowNew(false) }}
        title={modalBoat ? 'Rediger båt' : 'Ny båt'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalBoat(null); setShowNew(false) }}>
              Avbryt
            </Button>
            <Button loading={isPending} onClick={handleSave}>Lagre</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Navn"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Båtens navn"
          />
          <Select
            label="Type"
            value={form.boat_type_id}
            onChange={e => setForm(f => ({ ...f, boat_type_id: e.target.value }))}
            options={boatTypes.map(t => ({ value: t.id, label: t.name }))}
          />
          <Select
            label="Brukes av"
            value={form.team_id}
            onChange={e => setForm(f => ({ ...f, team_id: e.target.value, secondary_team_id: f.secondary_team_id === e.target.value ? '' : f.secondary_team_id }))}
            options={primaryTeamOptions}
            placeholder="Velg treningsgruppe"
          />
          <Select
            label="Kan brukes av (valgfritt)"
            value={form.secondary_team_id}
            onChange={e => setForm(f => ({ ...f, secondary_team_id: e.target.value }))}
            options={secondaryTeamOptions}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as BoatStatus }))}
            options={[
              { value: 'available',   label: 'Tilgjengelig' },
              { value: 'maintenance', label: 'Vedlikehold' },
              { value: 'away',        label: 'På tur/regatta' },
            ]}
          />
          {form.status === 'away' && (
            <Input
              type="date"
              label="Tilgjengelig igjen (valgfritt)"
              value={form.available_from}
              onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))}
            />
          )}
          <Input
            label="Nummer (valgfritt)"
            value={form.boat_number}
            onChange={e => setForm(f => ({ ...f, boat_number: e.target.value }))}
            placeholder="F.eks. 142"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Merknader (valgfritt)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-club-blue resize-none"
              placeholder="Vedlikeholdsinfo, advarsler, osv."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
