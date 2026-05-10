import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/Toast'
import { Dashboard } from '@/screens/Dashboard'
import { AdminGate } from '@/screens/Admin'
import { MemberAdmin } from '@/screens/Admin/Members'
import { BoatAdmin } from '@/screens/Admin/Boats'
import { RouteAdmin } from '@/screens/Admin/Routes'
import { LogbookAdmin } from '@/screens/Admin/Logbook'
import { TeamAdmin } from '@/screens/Admin/Teams'
import { BoatTypeAdmin } from '@/screens/Admin/BoatTypes'
import { DistancesAdmin } from '@/screens/Admin/Distances'
import { AppLogin } from '@/screens/Login'
import { useAppAuth } from '@/hooks/useAppAuth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      retry: 2,
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})

function AppContent() {
  const { isAuthenticated, authenticate } = useAppAuth()
  if (!isAuthenticated) return <AppLogin onLogin={authenticate} />

  return (
    <BrowserRouter>
      <div className="h-full flex flex-col">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminGate />}>
            <Route index element={<Navigate to="members" replace />} />
            <Route path="members" element={<MemberAdmin />} />
            <Route path="boats"   element={<BoatAdmin />} />
            <Route path="teams"      element={<TeamAdmin />} />
            <Route path="boat-types" element={<BoatTypeAdmin />} />
            <Route path="routes"     element={<RouteAdmin />} />
            <Route path="logbook" element={<LogbookAdmin />} />
            <Route path="distances" element={<DistancesAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  )
}
