import { useState } from 'react'

const CORRECT_PIN = import.meta.env.VITE_ADMIN_PIN ?? '1234'

export function useAdminPin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  function authenticate(pin: string): boolean {
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  function logout() {
    setIsAuthenticated(false)
  }

  return { isAuthenticated, authenticate, logout }
}
