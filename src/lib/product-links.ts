/** Next's deferred route params may retain percent-encoded path segments. */
export function decodeProductSlug(value: string): string {
  try { return decodeURIComponent(value) }
  catch { return value }
}
