import { db, sessionMemberId } from './dexie'
import { api } from './api'
import type { QueuedOperation, StartSessionInput, StopSessionInput } from '@/types'

const MAX_RETRIES = 5

async function processOperation(op: QueuedOperation): Promise<void> {
  switch (op.type) {
    case 'START_SESSION': {
      const input = op.payload as StartSessionInput & { optimistic_id: string }
      const { optimistic_id, ...rest } = input
      // Idempotent server-side (upsert på id) → trygt å replaye.
      await api.post('/sessions', { id: optimistic_id, ...rest })
      break
    }

    case 'STOP_SESSION': {
      const input = op.payload as StopSessionInput
      await api.patch(`/sessions/${input.session_id}`, input)
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
  op: Omit<QueuedOperation, 'id' | 'retry_count' | 'last_error'>,
): Promise<void> {
  await db.queue.add({ ...op, retry_count: 0, last_error: null })
}

export { sessionMemberId }
