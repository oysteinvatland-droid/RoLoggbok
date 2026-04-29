import { useState } from 'react'
import { useRoutes, useCreateRoute, useUpdateRoute } from '@/hooks/useBoats'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import type { Route } from '@/types'

interface RouteFormValues { name: string; distance_km: string }
const DEFAULT_FORM: RouteFormValues = { name: '', distance_km: '' }

export function RouteAdmin() {
  const { data: routes = [], isLoading } = useRoutes()
  const createRoute = useCreateRoute()
  const updateRoute = useUpdateRoute()
  const { toast } = useToast()

  const [modalRoute, setModalRoute] = useState<Route | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<RouteFormValues>(DEFAULT_FORM)

  function openEdit(r: Route) {
    setModalRoute(r)
    setForm({ name: r.name, distance_km: r.distance_km?.toString() ?? '' })
    setShowNew(false)
  }

  function openNew() {
    setModalRoute(null)
    setForm(DEFAULT_FORM)
    setShowNew(true)
  }

  async function handleSave() {
    const distance = form.distance_km ? parseFloat(form.distance_km) : null
    try {
      if (modalRoute) {
        await updateRoute.mutateAsync({ id: modalRoute.id, name: form.name, distance_km: distance })
        toast('Rute oppdatert')
      } else {
        await createRoute.mutateAsync({ name: form.name, distance_km: distance, archived_at: null })
        toast('Rute lagt til')
      }
      setModalRoute(null)
      setShowNew(false)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  async function handleArchive(r: Route) {
    await updateRoute.mutateAsync({
      id: r.id,
      archived_at: r.archived_at ? null : new Date().toISOString(),
    })
    toast(r.archived_at ? 'Rute gjenopprettet' : 'Rute arkivert')
  }

  const isPending = createRoute.isPending || updateRoute.isPending

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ruter</h1>
        <Button onClick={openNew}>+ Ny rute</Button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Laster...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {routes.length === 0 && (
            <p className="p-4 text-sm text-gray-400">Ingen ruter registrert.</p>
          )}
          {routes.map(r => (
            <div key={r.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{r.name}</p>
                {r.distance_km && (
                  <p className="text-sm text-gray-500">{r.distance_km} km</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Rediger</Button>
                <Button variant="ghost" size="sm" onClick={() => handleArchive(r)}>Arkiver</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNew || !!modalRoute}
        onClose={() => { setModalRoute(null); setShowNew(false) }}
        title={modalRoute ? 'Rediger rute' : 'Ny rute'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalRoute(null); setShowNew(false) }}>Avbryt</Button>
            <Button loading={isPending} onClick={handleSave}>Lagre</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Navn"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="F.eks. Sandvika–Høvik"
          />
          <Input
            label="Distanse (km, valgfritt)"
            type="number"
            step="0.1"
            value={form.distance_km}
            onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))}
            placeholder="F.eks. 8.5"
          />
        </div>
      </Modal>
    </div>
  )
}
