import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function Help() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      {/* Topplinje — samme mønster som admin */}
      <header className="flex items-center justify-between px-6 h-14 bg-gray-900 text-white shrink-0">
        <span className="font-semibold">Hjelp</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white"
          onClick={() => navigate('/')}
        >
          ← Forside
        </Button>
      </header>

      {/* Brukerveiledningen ligger som statisk HTML i public/ */}
      <iframe
        src="/brukerveiledning.html"
        title="Brukerveiledning"
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  )
}
