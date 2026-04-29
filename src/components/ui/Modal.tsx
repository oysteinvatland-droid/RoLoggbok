import { useEffect, useRef, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ isOpen, onClose, title, size = 'md', children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen) {
      if (!el.open) el.showModal()
    } else {
      if (el.open) el.close()
    }
  }, [isOpen])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handler = (e: Event) => {
      const rect = el.getBoundingClientRect()
      const me = e as MouseEvent
      if (me.clientX < rect.left || me.clientX > rect.right ||
          me.clientY < rect.top  || me.clientY > rect.bottom) {
        onClose()
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [onClose])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={clsx(
        'rounded-2xl shadow-2xl p-0 border-0 backdrop:bg-black/40 backdrop:backdrop-blur-sm',
        'open:flex open:flex-col max-h-[90dvh] overflow-hidden',
        {
          'w-[480px]':  size === 'sm',
          'w-[600px]':  size === 'md',
          'w-[800px]':  size === 'lg',
          'w-[95vw]':   size === 'full',
        }
      )}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          aria-label="Lukk"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0 bg-gray-50">
          {footer}
        </div>
      )}
    </dialog>
  )
}
