import { useCallback, useEffect } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { enqueue, flushQueue } from '@/lib/sync'
import type { QueuedOperation } from '@/types'

export function useOfflineQueue() {
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (isOnline) {
      flushQueue().catch(console.error)
    }
  }, [isOnline])

  const addToQueue = useCallback(
    async (op: Omit<QueuedOperation, 'id' | 'retry_count' | 'last_error'>) => {
      await enqueue(op)
      if (isOnline) {
        await flushQueue()
      }
    },
    [isOnline]
  )

  return { addToQueue, isOnline }
}
