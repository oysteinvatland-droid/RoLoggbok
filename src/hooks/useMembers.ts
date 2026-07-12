import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, CLUB_ID } from '@/lib/api'
import { db, mirror, readMirror } from '@/lib/dexie'
import type { Member } from '@/types'

export const memberKeys = {
  all: ['members', CLUB_ID] as const,
  active: ['members', CLUB_ID, 'active'] as const,
}

export function useMembers() {
  return useQuery({
    queryKey: memberKeys.active,
    queryFn: async (): Promise<Member[]> => {
      try {
        const data = await api.get<Member[]>('/members')
        await mirror(() => db.members.bulkPut(data))
        return data
      } catch {
        // Offline-fallback fra lokal speiling (kun denne klubbens data ligger i Dexie)
        return readMirror(() => db.members.filter((m) => !m.archived_at).sortBy('name'), [])
      }
    },
    staleTime: 60_000,
  })
}

export function useAllMembers() {
  return useQuery({
    queryKey: memberKeys.all,
    queryFn: async (): Promise<Member[]> => {
      const data = await api.get<Member[]>('/members?scope=all')
      await mirror(() => db.members.bulkPut(data))
      return data
    },
    staleTime: 30_000,
  })
}

// Roere som har brukt en gitt båt før, sortert med sist brukt øverst.
export function useBoatRowers(boatId: string) {
  return useQuery({
    queryKey: ['members', CLUB_ID, 'boat-rowers', boatId],
    queryFn: () => api.get<Member[]>(`/boats/${boatId}/rowers`),
    staleTime: 30_000,
  })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<Member, 'id' | 'club_id' | 'created_at' | 'updated_at'>) =>
      api.post<Member>('/members', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', CLUB_ID] }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<Member> & { id: string }) =>
      api.patch<Member>(`/members/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', CLUB_ID] }),
  })
}
