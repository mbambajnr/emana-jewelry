import { requireAdmin } from "@/lib/auth"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import styles from "./analytics.module.css"

interface RecentClickItem {
  id: string
  source: string
  label: string | null
  product: string | null
  createdAt: Date
}

async function AnalyticsContent() {
  await requireAdmin()
  let totalClicks = 0
  let topProducts: Array<{ product: string | null; _count: { id: number } }> = []
  let sources: Array<{ source: string; _count: { id: number } }> = []
  let recentClicks: RecentClickItem[] = []

  try {
    const [tClicks, tProducts, sBreakdown, rClicks] = await Promise.all([
      prisma.whatsAppClick.count(),
      getTopProducts(),
      getSourceBreakdown(),
      prisma.whatsAppClick.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ])
    totalClicks = tClicks
    topProducts = tProducts
    sources = sBreakdown
    recentClicks = rClicks
  } catch {
    return <p role="alert">We couldn’t load this information. Check the database connection and migrations, then refresh. No records have been changed.</p>
  }

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalClicks}</span>
          <span className={styles.statLabel}>WhatsApp Clicks</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Top Products</h2>
          {topProducts.length === 0 ? (
            <p className={styles.empty}>No data yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.product}>
                    <td>{p.product}</td>
                    <td className={styles.mono}>{p._count.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>By Page</h2>
          {sources.length === 0 ? (
            <p className={styles.empty}>No data yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source}>
                    <td className={styles.sourceCell}>{s.source}</td>
                    <td className={styles.mono}>{s._count.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        {recentClicks.length === 0 ? (
          <p className={styles.empty}>No clicks recorded yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Page</th>
                <th>Label</th>
                <th>Product</th>
              </tr>
            </thead>
            <tbody>
              {recentClicks.map((c) => (
                <tr key={c.id}>
                  <td className={styles.mono}>
                    {new Date(c.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className={styles.sourceCell}>{c.source}</td>
                  <td>{c.label || "—"}</td>
                  <td>{c.product || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

async function getTopProducts() {
  try {
    const clicks = await prisma.whatsAppClick.groupBy({
      by: ["product"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    })
    return clicks.filter((c) => c.product)
  } catch {
    return []
  }
}

async function getSourceBreakdown() {
  try {
    const clicks = await prisma.whatsAppClick.groupBy({
      by: ["source"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    })
    return clicks
  } catch {
    return []
  }
}

export default function AnalyticsPage() {
  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
      </div>
      <Suspense fallback={<p className={styles.loading}>Loading analytics...</p>}>
        <AnalyticsContent />
      </Suspense>
    </div>
  )
}
