type AlertVariant = 'error' | 'warning' | 'info'

interface AlertProps {
  variant?: AlertVariant
  message: string
}

const STYLES: Record<AlertVariant, string> = {
  error: 'bg-red-900/40 border-red-700 text-red-300',
  warning: 'bg-amber-900/40 border-amber-700 text-amber-300',
  info: 'bg-blue-900/40 border-blue-700 text-blue-300',
}

const ICONS: Record<AlertVariant, string> = {
  error: '⚠',
  warning: '⚠',
  info: 'ℹ',
}

export function Alert({ variant = 'error', message }: AlertProps) {
  return (
    <div className={`flex gap-2 p-3 rounded-lg border text-sm ${STYLES[variant]}`}>
      <span>{ICONS[variant]}</span>
      <span>{message}</span>
    </div>
  )
}
