/**
 * Local id generator. `crypto.randomUUID()` needs a secure context, so fall back to
 * a random string when it is unavailable (older browsers, http:// hosts).
 */
export function uid(prefix = ''): string {
  const c = globalThis.crypto
  const id = c && typeof c.randomUUID === 'function'
    ? c.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  return prefix ? `${prefix}_${id}` : id
}
