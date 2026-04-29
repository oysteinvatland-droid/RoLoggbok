import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/dexie'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

export function StatusBar() {
  const isOnline = useOnlineStatus()
  const [now, setNow] = useState(new Date())
  const pendingCount = useLiveQuery(() => db.queue.count(), [], 0)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 h-16 bg-gray-100 text-gray-800 shrink-0">
      <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
        <img src="/icons/BærumLogo.png" alt="Bærum Roklubb" className="h-10 w-auto" />
        Båtlogg
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <span className="font-mono text-base tabular-nums opacity-90">
          {format(now, 'HH:mm', { locale: nb })}
        </span>

        {isOnline ? (
          <span className="flex items-center gap-1.5 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Tilkoblet
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-amber-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Frakoblet
            {(pendingCount ?? 0) > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </span>
        )}

        <a
          href="/brukerveiledning.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 transition text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Hjelp
        </a>

        <Link
          to="/admin"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 transition text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Admin
        </Link>
      </div>
    </header>
  )
}
