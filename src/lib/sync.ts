import { v4 as uuidv4 } from 'uuid'
import { db, sessionMemberId } from './dexie'
import { supabase, CLUB_ID } from './supabase'
import type { QueuedOperation, StartSessionInput, StopSessionInput } from '@/types'

const MAX_RETRIES = 5

async function processOperation(op: QueuedOperation): Promise<void> {
  switch (op.type) {
    case 'START_SESSION': {
      const input = op.payload as StartSessionInput & { optimistic_id: string }
      const { member_ids, optimistic_id, ...sessionData } = input

      const { error } = await supabase
        .from('sessions')
        .upsert({ id: optimistic_id, club_id: CLUB_ID, ...sessionData })
      if (error) throw error

      if (member_ids.length > 0) {
        const { error: smError } = await supabase
          .from('session_members')
          .upsert(member_ids.map(mid => ({ session_id: optimistic_id, member_id: mid })))
        if (smError) throw smError
      }
      break
    }

    case 'STOP_SESSION': {
      const input = op.payload as StopSessionInput
      const { error } = await supabase
        .from('sessions')
        .update({ end_time: input.end_time, has_been_coached: input.has_been_coached })
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
      break
    }
  }
}

export async function flushQueue(): Promise<void> {
  const ops = await db.queue.orderBy('id').toArray()
  for (const op of ops) {
    try {
      await processOperation(op)
      await db.queue.delete(op.id!)
    } catch (err) {
      const retries = op.retry_count + 1
      if (retries >= MAX_RETRIES) {
        console.error('Operasjon feilet permanent:', op, err)
        await db.queue.delete(op.id!)
      } else {
        await db.queue.update(op.id!, { retry_count: retries, last_error: String(err) })
      }
    }
  }
}

export async function enqueue(
  op: Omit<QueuedOperation, 'id' | 'retry_count' | 'last_error'>
): Promise<void> {
  await db.queue.add({ ...op, retry_count: 0, last_error: null })
}

export { sessionMemberId }
