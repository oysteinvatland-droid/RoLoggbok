import { useState } from 'react'

const CORRECT_PIN = import.meta.env.VITE_ADMIN_PIN ?? '1234'
const SESSION_KEY = 'baatlogg_admin_auth'

export function useAdminPin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  )

  function authenticate(pin: string): boolean {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
  }

  return { isAuthenticated, authenticate, logout }
}
