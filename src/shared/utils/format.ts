/**
 * Truncates a TON address for display purposes.
 * e.g. "EQD4FP...p6_0t"
 */
export function truncateAddress(addr: string, prefix = 6, suffix = 6): string {
  if (!addr) return '—'
  if (addr.length <= prefix + suffix) return addr
  return `${addr.slice(0, prefix)}...${addr.slice(-suffix)}`
}
