import { useState } from 'react'
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@/hooks/useBoats'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import type { Team } from '@/types'

interface TeamFormValues { name: string; sort_order: string }
const DEFAULT_FORM: TeamFormValues = { name: '', sort_order: '' }

export function TeamAdmin() {
  const { data: teams = [], isLoading } = useTeams()
  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()
  const deleteTeam = useDeleteTeam()
  const { toast } = useToast()

  const [modalTeam, setModalTeam] = useState<Team | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<TeamFormValues>(DEFAULT_FORM)
  const [confirmDelete, setConfirmDelete] = useState<Team | null>(null)

  function openEdit(t: Team) {
    setModalTeam(t)
    setForm({ name: t.name, sort_order: String(t.sort_order) })
    setShowNew(false)
  }

  function openNew() {
    setModalTeam(null)
    setForm(DEFAULT_FORM)
    setShowNew(true)
  }

  async function handleSave() {
    const sort_order = form.sort_order ? parseInt(form.sort_order, 10) : 0
    try {
      if (modalTeam) {
        await updateTeam.mutateAsync({ id: modalTeam.id, name: form.name, sort_order })
        toast('Lag oppdatert')
      } else {
        await createTeam.mutateAsync({ name: form.name, sort_order })
        toast('Lag lagt til')
      }
      setModalTeam(null)
      setShowNew(false)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  async function handleDelete(t: Team) {
    try {
      await deleteTeam.mutateAsync(t.id)
      toast('Lag slettet')
      setConfirmDelete(null)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  const isPending = createTeam.isPending || updateTeam.isPending

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lag</h1>
        <Button onClick={openNew}>+ Nytt lag</Button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Laster...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {teams.length === 0 && (
            <p className="p-4 text-sm text-gray-400">Ingen lag registrert.</p>
          )}
          {teams.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">Rekkefølge: {t.sort_order}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Rediger</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(t)}>Slett</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNew || !!modalTeam}
        onClose={() => { setModalTeam(null); setShowNew(false) }}
        title={modalTeam ? 'Rediger lag' : 'Nytt lag'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalTeam(null); setShowNew(false) }}>Avbryt</Button>
            <Button loading={isPending} onClick={handleSave}>Lagre</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Navn"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="F.eks. BR Aktive"
          />
          <Input
            label="Rekkefølge"
            type="number"
            value={form.sort_order}
            onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
            placeholder="F.eks. 1"
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Slett lag"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Avbryt</Button>
            <Button variant="danger" loading={deleteTeam.isPending} onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Slett
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Er du sikker på at du vil slette <strong>{confirmDelete?.name}</strong>?
          Båter som tilhører dette laget vil ikke lenger ha et lag.
        </p>
      </Modal>
    </div>
  )
}
