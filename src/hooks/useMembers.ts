import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, CLUB_ID } from '@/lib/supabase'
import { db } from '@/lib/dexie'
import type { Member } from '@/types'

export const memberKeys = {
  all:    ['members', CLUB_ID] as const,
  active: ['members', CLUB_ID, 'active'] as const,
}

export function useMembers() {
  return useQuery({
    queryKey: memberKeys.active,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('club_id', CLUB_ID)
        .is('archived_at', null)
        .order('name')
      if (error) {
        return db.members.where('club_id').equals(CLUB_ID).filter(m => !m.archived_at).sortBy('name')
      }
      await db.members.bulkPut(data as Member[])
      return data as Member[]
    },
    staleTime: 60_000,
  })
}

export function useAllMembers() {
  return useQuery({
    queryKey: memberKeys.all,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('club_id', CLUB_ID)
        .order('name')
      if (error) throw error
      await db.members.bulkPut(data as Member[])
      return data as Member[]
    },
    staleTime: 30_000,
  })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Member, 'id' | 'club_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('members')
        .insert({ ...input, club_id: CLUB_ID })
        .select()
        .single()
      if (error) throw error
      return data as Member
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', CLUB_ID] }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Member> & { id: string }) => {
      const { data, error } = await supabase
        .from('members')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Member
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', CLUB_ID] }),
  })
}
