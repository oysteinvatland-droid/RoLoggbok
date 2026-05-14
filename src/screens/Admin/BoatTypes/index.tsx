import { useState } from 'react'
import { useBoatTypes, useCreateBoatType, useUpdateBoatType, useDeleteBoatType } from '@/hooks/useBoats'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import type { BoatKind } from '@/types'

const CREW_SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ value: String(n), label: String(n) }))

interface BoatTypeFormValues { name: string; crew_size: string; has_coach: boolean }
const DEFAULT_FORM: BoatTypeFormValues = { name: '', crew_size: '1', has_coach: false }

export function BoatTypeAdmin() {
  const { data: boatTypes = [], isLoading } = useBoatTypes()
  const createBoatType = useCreateBoatType()
  const updateBoatType = useUpdateBoatType()
  const deleteBoatType = useDeleteBoatType()
  const { toast } = useToast()

  const [modalItem, setModalItem] = useState<BoatKind | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<BoatTypeFormValues>(DEFAULT_FORM)
  const [confirmDelete, setConfirmDelete] = useState<BoatKind | null>(null)

  function openEdit(bt: BoatKind) {
    setModalItem(bt)
    setForm({ name: bt.name, crew_size: String(bt.crew_size), has_coach: bt.has_coach })
    setShowNew(false)
  }

  function openNew() {
    setModalItem(null)
    setForm(DEFAULT_FORM)
    setShowNew(true)
  }

  async function handleSave() {
    const crew_size = parseInt(form.crew_size, 10)
    try {
      if (modalItem) {
        await updateBoatType.mutateAsync({ id: modalItem.id, name: form.name, crew_size, has_coach: form.has_coach })
        toast('Båttype oppdatert')
      } else {
        await createBoatType.mutateAsync({ name: form.name, crew_size, has_coach: form.has_coach })
        toast('Båttype lagt til')
      }
      setModalItem(null)
      setShowNew(false)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  async function handleDelete(bt: BoatKind) {
    try {
      await deleteBoatType.mutateAsync(bt.id)
      toast('Båttype slettet')
      setConfirmDelete(null)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  const isPending = createBoatType.isPending || updateBoatType.isPending

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Båttyper</h1>
        <Button onClick={openNew}>+ Ny båttype</Button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Laster...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {boatTypes.length === 0 && (
            <p className="p-4 text-sm text-gray-400">Ingen båttyper registrert.</p>
          )}
          {boatTypes.map(bt => (
            <div key={bt.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{bt.name}</p>
                <p className="text-xs text-gray-400">
                  {bt.crew_size} roer{bt.crew_size !== 1 ? 'e' : ''}
                  {bt.has_coach && ' · Med coach'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(bt)}>Rediger</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(bt)}>Slett</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNew || !!modalItem}
        onClose={() => { setModalItem(null); setShowNew(false) }}
        title={modalItem ? 'Rediger båttype' : 'Ny båttype'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalItem(null); setShowNew(false) }}>Avbryt</Button>
            <Button loading={isPending} onClick={handleSave}>Lagre</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Type"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="F.eks. Singlesculler (1x)"
          />
          <Select
            label="Antall roere"
            value={form.crew_size}
            onChange={e => setForm(f => ({ ...f, crew_size: e.target.value }))}
            options={CREW_SIZE_OPTIONS}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.has_coach}
              onChange={e => setForm(f => ({ ...f, has_coach: e.target.checked }))}
              className="w-4 h-4"
            />
            Med coach
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Slett båttype"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Avbryt</Button>
            <Button variant="danger" loading={deleteBoatType.isPending} onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Slett
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Er du sikker på at du vil slette <strong>{confirmDelete?.name}</strong>?
        </p>
      </Modal>
    </div>
  )
}
