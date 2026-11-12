export function socketConnectionOptions(url) {
  const socketPath = url.searchParams.get('socket')
  if (!socketPath) return {}
  if (!socketPath.startsWith('/') || socketPath.includes('\0') || socketPath.length > 104 || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.searchParams.has('sslaccept')) throw new Error('Use an absolute local MySQL socket path with a localhost URL and no TLS option.')
  return { socketPath }
}
