export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <span
      className={`${sizes[size]} border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin inline-block`}
    />
  )
}
