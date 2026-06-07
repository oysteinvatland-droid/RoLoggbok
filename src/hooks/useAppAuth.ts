import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface SessionInfo {
  authenticated: boolean
  admin: boolean
}

export function useAppAuth() {
  // null = laster sesjonsstatus fra serveren; deretter true/false.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    api
      .get<SessionInfo>('/session')
      .then((s) => setIsAuthenticated(s.authenticated))
      .catch(() => setIsAuthenticated(false))
  }, [])

  async function authenticate(username: string, password: string): Promise<boolean> {
    try {
      await api.post('/login', { username, password })
      setIsAuthenticated(true)
      return true
    } catch {
      return false
    }
  }

  return { isAuthenticated, authenticate }
}
