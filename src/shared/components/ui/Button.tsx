import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  isLoading?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-900 disabled:text-blue-400',
  secondary:
    'bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:bg-slate-800 disabled:text-slate-500',
  danger:
    'bg-red-700 hover:bg-red-600 text-white disabled:bg-red-900 disabled:text-red-400',
  ghost:
    'bg-transparent hover:bg-slate-800 text-slate-300 disabled:text-slate-600',
}

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2.5 rounded-lg font-medium text-sm
        transition-colors duration-150 cursor-pointer
        disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${className}
      `}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
