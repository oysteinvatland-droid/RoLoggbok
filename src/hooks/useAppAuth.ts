import { useState } from 'react'

const CORRECT_USERNAME = import.meta.env.VITE_APP_USERNAME ?? 'admin'
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? ''
const SESSION_KEY = 'baatlogg_app_auth'

export function useAppAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  )

  function authenticate(username: string, password: string): boolean {
    if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  return { isAuthenticated, authenticate }
}
