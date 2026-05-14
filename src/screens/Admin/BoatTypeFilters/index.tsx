import { useState } from 'react'
import {
  useBoatTypeFilters,
  useCreateBoatTypeFilter,
  useUpdateBoatTypeFilter,
  useDeleteBoatTypeFilter,
  useAssignBoatTypesToFilter,
  type BoatTypeFilterWithTypes,
} from '@/hooks/useBoatTypeFilters'
import { useBoatTypes } from '@/hooks/useBoats'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface FilterFormValues {
  name: string
  sort_order: number
  boatTypeIds: string[]
}

const DEFAULT_FORM: FilterFormValues = { name: '', sort_order: 0, boatTypeIds: [] }

export function BoatTypeFiltersAdmin() {
  const { data: filters = [], isLoading } = useBoatTypeFilters()
  const { data: allBoatTypes = [] } = useBoatTypes()
  const createFilter = useCreateBoatTypeFilter()
  const updateFilter = useUpdateBoatTypeFilter()
  const deleteFilter = useDeleteBoatTypeFilter()
  const assignBoatTypes = useAssignBoatTypesToFilter()
  const { toast } = useToast()

  const [modalItem, setModalItem] = useState<BoatTypeFilterWithTypes | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<FilterFormValues>(DEFAULT_FORM)
  const [confirmDelete, setConfirmDelete] = useState<BoatTypeFilterWithTypes | null>(null)

  function openEdit(f: BoatTypeFilterWithTypes) {
    setModalItem(f)
    setForm({ name: f.name, sort_order: f.sort_order, boatTypeIds: f.boat_types.map(bt => bt.id) })
    setShowNew(false)
  }

  function openNew() {
    setModalItem(null)
    const nextOrder = filters.length > 0 ? Math.max(...filters.map(f => f.sort_order)) + 1 : 1
    setForm({ ...DEFAULT_FORM, sort_order: nextOrder })
    setShowNew(true)
  }

  function toggleBoatType(id: string) {
    setForm(f => ({
      ...f,
      boatTypeIds: f.boatTypeIds.includes(id)
        ? f.boatTypeIds.filter(x => x !== id)
        : [...f.boatTypeIds, id],
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast('Navn er påkrevd', 'error')
      return
    }
    try {
      if (modalItem) {
        await updateFilter.mutateAsync({ id: modalItem.id, name: form.name, sort_order: form.sort_order })
        await assignBoatTypes.mutateAsync({
          filterId: modalItem.id,
          boatTypeIds: form.boatTypeIds,
          previousBoatTypeIds: modalItem.boat_types.map(bt => bt.id),
        })
        toast('Filter oppdatert')
      } else {
        const created = await createFilter.mutateAsync({ name: form.name, sort_order: form.sort_order })
        if (form.boatTypeIds.length > 0) {
          await assignBoatTypes.mutateAsync({
            filterId: created.id,
            boatTypeIds: form.boatTypeIds,
            previousBoatTypeIds: [],
          })
        }
        toast('Filter lagt til')
      }
      setModalItem(null)
      setShowNew(false)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  async function handleDelete(f: BoatTypeFilterWithTypes) {
    try {
      await deleteFilter.mutateAsync(f.id)
      toast('Filter slettet')
      setConfirmDelete(null)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  const isPending = createFilter.isPending || updateFilter.isPending || assignBoatTypes.isPending

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Filter</h1>
        <Button onClick={openNew}>+ Nytt filter</Button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Laster...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filters.length === 0 && (
            <p className="p-4 text-sm text-gray-400">Ingen filtere registrert.</p>
          )}
          {filters.map(f => (
            <div key={f.id} className="flex items-start gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {f.name}
                  <span className="ml-2 text-xs font-normal text-gray-400">({f.boat_types.length})</span>
                  <span className="ml-2 text-xs font-normal text-gray-400">#{f.sort_order}</span>
                </p>
                {f.boat_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {f.boat_types.map(bt => (
                      <Badge key={bt.id} variant="neutral" size="sm">{bt.name}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>Rediger</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(f)}>Slett</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNew || !!modalItem}
        onClose={() => { setModalItem(null); setShowNew(false) }}
        title={modalItem ? 'Rediger filter' : 'Nytt filter'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalItem(null); setShowNew(false) }}>Avbryt</Button>
            <Button loading={isPending} onClick={handleSave}>Lagre</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Navn"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="F.eks. Singelsculler 1x"
              />
            </div>
            <div className="w-28">
              <Input
                label="Rekkefølge"
                type="number"
                min={1}
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Båttyper</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allBoatTypes.map(bt => (
                <label key={bt.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.boatTypeIds.includes(bt.id)}
                    onChange={() => toggleBoatType(bt.id)}
                    className="w-4 h-4"
                  />
                  {bt.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Slett filter"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Avbryt</Button>
            <Button variant="danger" loading={deleteFilter.isPending} onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Slett
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Er du sikker på at du vil slette <strong>{confirmDelete?.name}</strong>?
          Båttypene vil ikke lenger ha et filter.
        </p>
      </Modal>
    </div>
  )
}
