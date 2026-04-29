import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAdminPin } from '@/hooks/useAdminPin'
import { Button } from '@/components/ui/Button'

export function AdminGate() {
  const { isAuthenticated, authenticate, logout } = useAdminPin()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handlePin(digit: string) {
    const next = pin + digit
    setPin(next)
    setError('')
    if (next.length === 4) {
      if (authenticate(next)) {
        setPin('')
      } else {
        setError('Feil PIN')
        setTimeout(() => setPin(''), 600)
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-80 text-center space-y-6">
          <div>
            <div className="w-14 h-14 bg-club-navy rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Skriv inn PIN-kode</p>
          </div>

          {/* PIN display */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? 'bg-club-navy border-club-navy' : 'border-gray-300'}`} />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button
                key={n}
                onClick={() => handlePin(String(n))}
                className="h-14 text-xl font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition"
              >
                {n}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePin('0')}
              className="h-14 text-xl font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition"
            >
              0
            </button>
            <button
              onClick={() => setPin(p => p.slice(0, -1))}
              className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            ← Tilbake til kiosk
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Admin top bar */}
      <header className="flex items-center justify-between px-6 h-14 bg-gray-900 text-white shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Admin</span>
          <nav className="flex gap-1">
            {[
              { to: 'members', label: 'Roere' },
              { to: 'boats',   label: 'Båter' },
              { to: 'teams',   label: 'Lag' },
              { to: 'routes',  label: 'Ruter' },
              { to: 'logbook', label: 'Loggbok' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition ${
                    isActive ? 'bg-white/20 text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate('/')}>
            ← Kiosk
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={logout}>
            Logg ut
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </div>
    </div>
  )
}
