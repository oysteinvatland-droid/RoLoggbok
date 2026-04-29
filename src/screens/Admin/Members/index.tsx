import { useState } from 'react'
import { useAllMembers, useCreateMember, useUpdateMember } from '@/hooks/useMembers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import {
  AGE_CATEGORY_LABELS, SERIOUSNESS_LABELS, MEMBER_ROLE_LABELS,
  ALL_AGE_CATEGORIES, ALL_SERIOUSNESS, ALL_ROLES,
} from '@/constants'
import type { Member, AgeCategory, SeriousnessType, MemberRole } from '@/types'

const ROLE_BADGE: Record<MemberRole, 'neutral' | 'info' | 'warning'> = {
  rower: 'neutral', coach: 'info', admin: 'warning',
}

interface MemberFormValues {
  name: string
  role: MemberRole
  age_category: AgeCategory
  seriousness: SeriousnessType
}

const DEFAULT_FORM: MemberFormValues = {
  name: '',
  role: 'rower',
  age_category: 'Senior',
  seriousness: 'recreational',
}

export function MemberAdmin() {
  const { data: members = [], isLoading } = useAllMembers()
  const createMember = useCreateMember()
  const updateMember = useUpdateMember()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AgeCategory | ''>('')
  const [showArchived, setShowArchived] = useState(false)
  const [modalMember, setModalMember] = useState<Member | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<MemberFormValues>(DEFAULT_FORM)

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === '' || m.age_category === categoryFilter
    const matchArchived = showArchived ? true : !m.archived_at
    return matchSearch && matchCategory && matchArchived
  })

  function openEdit(m: Member) {
    setModalMember(m)
    setForm({ name: m.name, role: m.role, age_category: m.age_category, seriousness: m.seriousness })
    setShowNew(false)
  }

  function openNew() {
    setModalMember(null)
    setForm(DEFAULT_FORM)
    setShowNew(true)
  }

  async function handleSave() {
    try {
      if (modalMember) {
        await updateMember.mutateAsync({ id: modalMember.id, ...form })
        toast('Roer oppdatert')
      } else {
        await createMember.mutateAsync({ ...form, archived_at: null })
        toast('Roer lagt til')
      }
      setModalMember(null)
      setShowNew(false)
      setForm(DEFAULT_FORM)
    } catch {
      toast('Noe gikk galt', 'error')
    }
  }

  async function handleArchive(m: Member) {
    const isArchived = !!m.archived_at
    await updateMember.mutateAsync({
      id: m.id,
      archived_at: isArchived ? null : new Date().toISOString(),
    })
    toast(isArchived ? 'Roer gjenopprettet' : 'Roer arkivert')
  }

  const isPending = createMember.isPending || updateMember.isPending

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Roere
          {!isLoading && <span className="ml-2 text-base font-normal text-gray-400">({filtered.length})</span>}
        </h1>
        <Button onClick={openNew}>+ Ny roer</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          className="flex-1 min-w-48"
          placeholder="Søk etter navn..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as AgeCategory | '')}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-club-blue bg-white text-gray-700"
        >
          <option value="">Alle klasser</option>
          {ALL_AGE_CATEGORIES.map(c => (
            <option key={c} value={c}>{AGE_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
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
            <p className="p-4 text-sm text-gray-400">Ingen roere funnet.</p>
          )}
          {filtered.map(m => (
            <div key={m.id} className={`flex items-center gap-4 px-4 py-3 ${m.archived_at ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{m.name}</p>
                <p className="text-sm text-gray-500">
                  {AGE_CATEGORY_LABELS[m.age_category]} · {SERIOUSNESS_LABELS[m.seriousness]}
                </p>
              </div>
              <Badge variant={ROLE_BADGE[m.role]} size="sm">{MEMBER_ROLE_LABELS[m.role]}</Badge>
              {m.archived_at && <Badge variant="neutral" size="sm">Arkivert</Badge>}
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>Rediger</Button>
                <Button variant="ghost" size="sm" onClick={() => handleArchive(m)}>
                  {m.archived_at ? 'Gjenopprett' : 'Arkiver'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNew || !!modalMember}
        onClose={() => { setModalMember(null); setShowNew(false) }}
        title={modalMember ? 'Rediger roer' : 'Ny roer'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalMember(null); setShowNew(false) }}>
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
            placeholder="Fullt navn"
          />
          <Select
            label="Rolle"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as MemberRole }))}
            options={ALL_ROLES.map(r => ({ value: r, label: MEMBER_ROLE_LABELS[r] }))}
          />
          <Select
            label="Alderskategori"
            value={form.age_category}
            onChange={e => setForm(f => ({ ...f, age_category: e.target.value as AgeCategory }))}
            options={ALL_AGE_CATEGORIES.map(c => ({ value: c, label: AGE_CATEGORY_LABELS[c] }))}
          />
          <Select
            label="Type"
            value={form.seriousness}
            onChange={e => setForm(f => ({ ...f, seriousness: e.target.value as SeriousnessType }))}
            options={ALL_SERIOUSNESS.map(s => ({ value: s, label: SERIOUSNESS_LABELS[s] }))}
          />
        </div>
      </Modal>
    </div>
  )
}
