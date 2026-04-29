import { useState, type FormEvent } from 'react'

interface Props {
  onLogin: (username: string, password: string) => boolean
}

export function AppLogin({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = onLogin(username, password)
    if (!ok) {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-6">
        <img src="/icons/BærumLogo.png" alt="Bærum Roklubb" className="h-20 w-auto" />
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Båtlogg</h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Brukernavn</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(false) }}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Passord</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">
              Feil brukernavn eller passord
            </p>
          )}

          <button
            type="submit"
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 text-base transition"
          >
            Logg inn
          </button>
        </form>
      </div>
    </div>
  )
}
