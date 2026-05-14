import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, CLUB_ID } from '@/lib/supabase'
import type { BoatKind, BoatTypeFilter } from '@/types'

export interface BoatTypeFilterWithTypes extends BoatTypeFilter {
  boat_types: BoatKind[]
}

export function useBoatTypeFilters() {
  return useQuery({
    queryKey: ['boat_type_filters', CLUB_ID],
    queryFn: async (): Promise<BoatTypeFilterWithTypes[]> => {
      const { data, error } = await supabase
        .from('boat_type_filters')
        .select('*, boat_types(*)')
        .eq('club_id', CLUB_ID)
        .order('sort_order')
      if (error) throw error
      return data as BoatTypeFilterWithTypes[]
    },
    staleTime: 60_000,
  })
}

export function useCreateBoatTypeFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; sort_order: number }) => {
      const { data, error } = await supabase
        .from('boat_type_filters')
        .insert({ ...input, club_id: CLUB_ID })
        .select()
        .single()
      if (error) throw error
      return data as BoatTypeFilter
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_type_filters', CLUB_ID] }),
  })
}

export function useUpdateBoatTypeFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, boat_types: _bt, ...input }: Partial<BoatTypeFilterWithTypes> & { id: string }) => {
      const { data, error } = await supabase
        .from('boat_type_filters')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as BoatTypeFilter
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_type_filters', CLUB_ID] }),
  })
}

export function useDeleteBoatTypeFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('boat_type_filters').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_type_filters', CLUB_ID] }),
  })
}

// Tilordner et sett med båttyper til et filter.
// - Setter filter_id på de valgte båttypene
// - Fjerner filter_id fra de som tidligere tilhørte filteret men ikke lenger er valgt
export function useAssignBoatTypesToFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ filterId, boatTypeIds, previousBoatTypeIds }: {
      filterId: string
      boatTypeIds: string[]
      previousBoatTypeIds: string[]
    }) => {
      const toAdd    = boatTypeIds.filter(id => !previousBoatTypeIds.includes(id))
      const toRemove = previousBoatTypeIds.filter(id => !boatTypeIds.includes(id))

      if (toAdd.length > 0) {
        const { error } = await supabase.from('boat_types').update({ filter_id: filterId }).in('id', toAdd)
        if (error) throw error
      }
      if (toRemove.length > 0) {
        const { error } = await supabase.from('boat_types').update({ filter_id: null }).in('id', toRemove)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boat_type_filters', CLUB_ID] })
      qc.invalidateQueries({ queryKey: ['boat_types', CLUB_ID] })
    },
  })
}
