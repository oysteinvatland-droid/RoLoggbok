import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, CLUB_ID } from '@/lib/supabase'
import { db } from '@/lib/dexie'
import type { Boat, BoatWithActiveSession, Member, Route, SessionWithDetails, Team } from '@/types'

export const boatKeys = {
  all:     ['boats', CLUB_ID] as const,
  active:  ['boats', CLUB_ID, 'active'] as const,
  dashboard: ['dashboard', CLUB_ID] as const,
}

export function useDashboardData() {
  return useQuery({
    queryKey: boatKeys.dashboard,
    queryFn: async (): Promise<BoatWithActiveSession[]> => {
      const [boatsRes, sessionsRes] = await Promise.all([
        supabase
          .from('boats')
          .select('*')
          .eq('club_id', CLUB_ID)
          .is('archived_at', null)
          .order('name'),
        supabase
          .from('sessions')
          .select(`
            *,
            boats:boat_id(*),
            routes:route_id(*),
            session_members(member_id, members(*)),
            incidents(*)
          `)
          .eq('club_id', CLUB_ID)
          .is('end_time', null),
      ])

      let boats: Boat[]
      if (boatsRes.error) {
        boats = await db.boats.where('club_id').equals(CLUB_ID).filter(b => !b.archived_at).sortBy('name')
      } else {
        boats = boatsRes.data as Boat[]
        await db.boats.bulkPut(boats)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessions: SessionWithDetails[] = (sessionsRes.data ?? []).map((s: any) => ({
        ...s,
        boat: s.boats,
        route: s.routes,
        members: (s.session_members ?? []).map((sm: { members: Member }) => sm.members).filter(Boolean),
        incident: s.incidents?.[0] ?? null,
      }))

      return boats.map(boat => ({
        ...boat,
        active_session: sessions.find(s => s.boat_id === boat.id) ?? null,
      }))
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
  })
}

export function useBoats() {
  return useQuery({
    queryKey: boatKeys.active,
    queryFn: async (): Promise<Boat[]> => {
      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('club_id', CLUB_ID)
        .is('archived_at', null)
        .order('name')
      if (error) throw error
      await db.boats.bulkPut(data as Boat[])
      return data as Boat[]
    },
    staleTime: 30_000,
  })
}

export function useAllBoats() {
  return useQuery({
    queryKey: boatKeys.all,
    queryFn: async (): Promise<Boat[]> => {
      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('club_id', CLUB_ID)
        .order('name')
      if (error) throw error
      return data as Boat[]
    },
    staleTime: 30_000,
  })
}

export function useCreateBoat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Boat, 'id' | 'club_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('boats')
        .insert({ ...input, club_id: CLUB_ID })
        .select()
        .single()
      if (error) throw error
      return data as Boat
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boats', CLUB_ID] }),
  })
}

export function useUpdateBoat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Boat> & { id: string }) => {
      const { data, error } = await supabase
        .from('boats')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Boat
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boats', CLUB_ID] }),
  })
}

export function useRoutes() {
  return useQuery({
    queryKey: ['routes', CLUB_ID],
    queryFn: async (): Promise<Route[]> => {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('club_id', CLUB_ID)
        .is('archived_at', null)
        .order('name')
      if (error) {
        return db.routes.where('club_id').equals(CLUB_ID).filter(r => !r.archived_at).sortBy('name')
      }
      await db.routes.bulkPut(data as Route[])
      return data as Route[]
    },
    staleTime: 60_000,
  })
}

export function useCreateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Route, 'id' | 'club_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('routes')
        .insert({ ...input, club_id: CLUB_ID })
        .select()
        .single()
      if (error) throw error
      return data as Route
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes', CLUB_ID] }),
  })
}

export function useUpdateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Route> & { id: string }) => {
      const { data, error } = await supabase
        .from('routes')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Route
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes', CLUB_ID] }),
  })
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams', CLUB_ID],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('club_id', CLUB_ID)
        .order('sort_order')
      if (error) throw error
      return data as Team[]
    },
    staleTime: 60_000,
  })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Team, 'id' | 'club_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({ ...input, club_id: CLUB_ID })
        .select()
        .single()
      if (error) throw error
      return data as Team
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', CLUB_ID] }),
  })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Team> & { id: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Team
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', CLUB_ID] }),
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', CLUB_ID] }),
  })
}
