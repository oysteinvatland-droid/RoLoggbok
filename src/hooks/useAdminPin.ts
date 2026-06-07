import { useState } from 'react'
import { api } from '@/lib/api'

export function useAdminPin() {
  // In-memory (ikke persistert) → PIN kreves hver gang admin åpnes, som før.
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  async function authenticate(pin: string): Promise<boolean> {
    try {
      await api.post('/admin/verify', { pin })
      setIsAuthenticated(true)
      return true
    } catch {
      return false
    }
  }

  function logout() {
    setIsAuthenticated(false)
  }

  return { isAuthenticated, authenticate, logout }
}
