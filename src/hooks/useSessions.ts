import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import { api, CLUB_ID } from '@/lib/api'
import { db, sessionMemberId } from '@/lib/dexie'
import { useOfflineQueue } from './useOfflineQueue'
import type { Session, SessionWithDetails, StartSessionInput, StopSessionInput } from '@/types'

export function useSessionHistory() {
  return useQuery({
    queryKey: ['sessions', CLUB_ID, 'history'],
    queryFn: () => api.get<SessionWithDetails[]>('/sessions/history'),
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

      return api.post<Session>('/sessions', { id: optimistic_id, ...input })
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

      await api.patch(`/sessions/${input.session_id}`, input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', CLUB_ID] })
      qc.invalidateQueries({ queryKey: ['sessions', CLUB_ID, 'history'] })
    },
  })
}
