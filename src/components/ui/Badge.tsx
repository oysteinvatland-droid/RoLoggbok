import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'success' | 'info' | 'warning' | 'danger' | 'neutral'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        {
          'bg-green-100 text-green-800':   variant === 'success',
          'bg-blue-100 text-blue-800':     variant === 'info',
          'bg-amber-100 text-amber-800':   variant === 'warning',
          'bg-red-100 text-red-800':       variant === 'danger',
          'bg-gray-100 text-gray-700':     variant === 'neutral',
          'text-xs px-2 py-0.5':           size === 'sm',
          'text-sm px-2.5 py-1':           size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
