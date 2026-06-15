import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, CLUB_ID } from '@/lib/api'
import { db, mirror, readMirror } from '@/lib/dexie'
import type { Boat, BoatKind, BoatWithActiveSession, Route, Team } from '@/types'

export const boatKeys = {
  all: ['boats', CLUB_ID] as const,
  active: ['boats', CLUB_ID, 'active'] as const,
  dashboard: ['dashboard', CLUB_ID] as const,
}

export function useDashboardData() {
  return useQuery({
    queryKey: boatKeys.dashboard,
    queryFn: async (): Promise<BoatWithActiveSession[]> => {
      try {
        // Server gjør away-reset, fletter aktive turer og sorterer på 30-dagers bruk.
        const data = await api.get<BoatWithActiveSession[]>('/dashboard')
        // Speil lokalt, men la aldri en cache-feil velte et vellykket server-svar.
        await mirror(() => db.boats.bulkPut(data.map(({ active_session: _a, ...boat }) => boat as Boat)))
        return data
      } catch {
        // Offline-fallback: speilede båter uten aktiv-tur-info
        const boats = await readMirror(() => db.boats.filter((b) => !b.archived_at).sortBy('name'), [])
        return boats.map((boat) => ({ ...boat, active_session: null }))
      }
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
  })
}

export function useBoats() {
  return useQuery({
    queryKey: boatKeys.active,
    queryFn: async (): Promise<Boat[]> => {
      try {
        const data = await api.get<Boat[]>('/boats')
        await mirror(() => db.boats.bulkPut(data))
        return data
      } catch {
        return readMirror(() => db.boats.filter((b) => !b.archived_at).sortBy('name'), [])
      }
    },
    staleTime: 30_000,
  })
}

export function useAllBoats() {
  return useQuery({
    queryKey: boatKeys.all,
    queryFn: () => api.get<Boat[]>('/boats?scope=all'),
    staleTime: 30_000,
  })
}

type BoatWriteInput = Omit<Boat, 'id' | 'club_id' | 'created_at' | 'updated_at' | 'boat_type' | 'team' | 'secondary_team'>

export function useCreateBoat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BoatWriteInput) => api.post<Boat>('/boats', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boats', CLUB_ID] }),
  })
}

export function useUpdateBoat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, boat_type: _bt, team: _t, secondary_team: _st, ...input }: Partial<Boat> & { id: string }) =>
      api.patch<Boat>(`/boats/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boats', CLUB_ID] }),
  })
}

export function useRoutes() {
  return useQuery({
    queryKey: ['routes', CLUB_ID],
    queryFn: async (): Promise<Route[]> => {
      try {
        const data = await api.get<Route[]>('/routes')
        await mirror(() => db.routes.bulkPut(data))
        return data
      } catch {
        return readMirror(() => db.routes.filter((r) => !r.archived_at).sortBy('name'), [])
      }
    },
    staleTime: 60_000,
  })
}

export function useCreateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<Route, 'id' | 'club_id' | 'created_at' | 'updated_at'>) =>
      api.post<Route>('/routes', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes', CLUB_ID] }),
  })
}

export function useUpdateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<Route> & { id: string }) =>
      api.patch<Route>(`/routes/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes', CLUB_ID] }),
  })
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams', CLUB_ID],
    queryFn: () => api.get<Team[]>('/teams'),
    staleTime: 60_000,
  })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<Team, 'id' | 'club_id' | 'created_at' | 'updated_at'>) =>
      api.post<Team>('/teams', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', CLUB_ID] }),
  })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<Team> & { id: string }) =>
      api.patch<Team>(`/teams/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', CLUB_ID] }),
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/teams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', CLUB_ID] }),
  })
}

export function useBoatTypes() {
  return useQuery({
    queryKey: ['boat_types', CLUB_ID],
    queryFn: () => api.get<BoatKind[]>('/boat-types'),
    staleTime: 60_000,
  })
}

type BoatTypeWriteInput = Omit<BoatKind, 'id' | 'club_id' | 'created_at' | 'updated_at' | 'filter' | 'filter_id'> & { filter_id?: string | null }

export function useCreateBoatType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BoatTypeWriteInput) => api.post<BoatKind>('/boat-types', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_types', CLUB_ID] }),
  })
}

export function useUpdateBoatType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, filter: _f, ...input }: Partial<Omit<BoatKind, 'filter'>> & { id: string; filter?: unknown }) =>
      api.patch<BoatKind>(`/boat-types/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_types', CLUB_ID] }),
  })
}

export function useDeleteBoatType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/boat-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boat_types', CLUB_ID] }),
  })
}
