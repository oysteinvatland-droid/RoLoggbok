import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        {
          // variants
          'bg-club-blue text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500':
            variant === 'primary',
          'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400':
            variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500':
            variant === 'danger',
          'text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400':
            variant === 'ghost',
          // sizes
          'text-sm px-3 h-9':  size === 'sm',
          'text-sm px-4 h-11': size === 'md',
          'text-base px-5 h-12': size === 'lg',
          'text-lg px-6 h-16':   size === 'xl',
        },
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
