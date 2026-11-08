import { pathToFileURL } from "node:url"

// Run with the private server environment loaded. No secret appears in cron arguments.
export async function runNotifications(env = process.env, send = fetch) {
  if (!env.NOTIFICATION_CRON_SECRET || env.NOTIFICATION_CRON_SECRET.length < 32) throw new Error('Configure NOTIFICATION_CRON_SECRET before enabling the scheduler.')
  const origin = new URL(env.NEXT_PUBLIC_SITE_URL)
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Use the public HTTPS site origin.')
  const response = await send(new URL('/api/jobs/notifications', origin), { method: 'POST', headers: { Authorization: `Bearer ${env.NOTIFICATION_CRON_SECRET}` }, redirect: 'error', signal: AbortSignal.timeout(90000) })
  if (!response.ok) throw new Error(`Notification runner failed (HTTP ${response.status}).`)
  const result = await response.json()
  if (!Number.isInteger(result.sent) || !Number.isInteger(result.failed)) throw new Error('Unexpected notification runner response.')
  console.log(JSON.stringify({ sent: result.sent, failed: result.failed }))
  if (result.failed) throw new Error('Some notifications failed; inspect Email Delivery in admin.')
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runNotifications().catch(() => { console.error('Notification run failed. Check the endpoint, private environment and admin Email Delivery.'); process.exitCode = 1 })
}
