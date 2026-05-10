import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import { supabase, CLUB_ID } from '@/lib/supabase'
import { db, sessionMemberId } from '@/lib/dexie'
import { useOfflineQueue } from './useOfflineQueue'
import type { Session, SessionWithDetails, Member, StartSessionInput, StopSessionInput } from '@/types'

export function useSessionHistory() {
  return useQuery({
    queryKey: ['sessions', CLUB_ID, 'history'],
    queryFn: async (): Promise<SessionWithDetails[]> => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          boats:boat_id(*),
          routes:route_id(*),
          session_members(member_id, members(*)),
          incidents(*)
        `)
        .eq('club_id', CLUB_ID)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false })
        .limit(200)
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((s: any) => ({
        ...s,
        boat: s.boats,
        route: s.routes,
        members: (s.session_members ?? []).map((sm: { members: Member }) => sm.members).filter(Boolean),
        incident: s.incidents?.[0] ?? null,
      }))
    },
    staleTime: 30_000,
  })
}

export function useStartSession() {
  const qc = useQueryClient()
  const { isOnline, addToQueue } = useOfflineQueue()

  return useMutation({
    mutationFn: async (input: StartSessionInput) => {
      const optimistic_id = uuidv4()
      const now = new Date().toISOString()

      if (!isOnline) {
        const optimistic: Session = {
          id: optimistic_id,
          club_id: CLUB_ID,
          boat_id: input.boat_id,
          route_id: input.route_id,
          start_time: input.start_time,
          estimated_end_time: input.estimated_end_time,
          end_time: null,
          comment: input.comment || null,
          has_been_coached: false,
          distance_km: null,
          created_at: now,
          updated_at: now,
        }
        await db.sessions.put(optimistic)
        for (const mid of input.member_ids) {
          await db.session_members.put({
            id: sessionMemberId(optimistic_id, mid),
            session_id: optimistic_id,
            member_id: mid,
          })
        }
        await addToQueue({
          type: 'START_SESSION',
          payload: { ...input, optimistic_id },
          created_at: now,
        })
        return optimistic
      }

      const { member_ids, ...sessionData } = input
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({ id: optimistic_id, club_id: CLUB_ID, ...sessionData })
        .select()
        .single()
      if (error) throw error

      if (member_ids.length > 0) {
        const { error: smErr } = await supabase
          .from('session_members')
          .insert(member_ids.map(mid => ({ session_id: session.id, member_id: mid })))
        if (smErr) throw smErr
      }
      return session as Session
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', CLUB_ID] })
    },
  })
}

export function useStopSession() {
  const qc = useQueryClient()
  const { isOnline, addToQueue } = useOfflineQueue()

  return useMutation({
    mutationFn: async (input: StopSessionInput) => {
      const now = new Date().toISOString()

      if (!isOnline) {
        await db.sessions.update(input.session_id, {
          end_time: input.end_time,
          has_been_coached: input.has_been_coached,
          distance_km: input.distance_km,
          updated_at: now,
        })
        await addToQueue({
          type: 'STOP_SESSION',
          payload: input,
          created_at: now,
        })
        return
      }

      const { error } = await supabase
        .from('sessions')
        .update({ end_time: input.end_time, has_been_coached: input.has_been_coached, distance_km: input.distance_km })
        .eq('id', input.session_id)
      if (error) throw error

      if (input.incident_description) {
        const { error: iErr } = await supabase.from('incidents').insert({
          id: uuidv4(),
          club_id: CLUB_ID,
          session_id: input.session_id,
          boat_id: input.boat_id,
          description: input.incident_description,
          occurred_at: input.end_time,
        })
        if (iErr) throw iErr
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', CLUB_ID] })
      qc.invalidateQueries({ queryKey: ['sessions', CLUB_ID, 'history'] })
    },
  })
}
