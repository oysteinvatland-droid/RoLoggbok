import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, CLUB_ID } from '@/lib/api'
import type { BoatKind, BoatTypeFilter } from '@/types'

export interface BoatTypeFilterWithTypes extends BoatTypeFilter {
  boat_types: BoatKind[]
}

export function useBoatTypeFilters() {
  return useQuery({
    queryKey: ['boat_type_filters', CLUB_ID],
    queryFn: () => api.get<BoatTypeFilterWithTypes[]>('/boat-type-filters'),
    staleTime: 60_000,
  })
}

export function useCreateBoatTypeFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; sort_order: number }) =>
      api.post<BoatTypeFilter>('/boat-type-filters', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_type_filters', CLUB_ID] }),
  })
}

export function useUpdateBoatTypeFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, boat_types: _bt, ...input }: Partial<BoatTypeFilterWithTypes> & { id: string }) =>
      api.patch<BoatTypeFilter>(`/boat-type-filters/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_type_filters', CLUB_ID] }),
  })
}

export function useDeleteBoatTypeFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/boat-type-filters/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_type_filters', CLUB_ID] }),
  })
}

// Tilordner et sett båttyper til et filter (server gjør diff + bulk-oppdatering).
export function useAssignBoatTypesToFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { filterId: string; boatTypeIds: string[]; previousBoatTypeIds: string[] }) =>
      api.post('/boat-types/assign-filter', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boat_type_filters', CLUB_ID] })
      qc.invalidateQueries({ queryKey: ['boat_types', CLUB_ID] })
    },
  })
}
