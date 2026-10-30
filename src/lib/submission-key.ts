export function submissionKey(previous: { body: string; key: string } | null, body: string) {
  return previous?.body === body ? previous : { body, key: crypto.randomUUID() }
}
