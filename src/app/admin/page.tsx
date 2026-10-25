import Link from "next/link"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import styles from "./dashboard.module.css"

export default function AdminDashboard() {
  return <div><h1 className={styles.title}>Your day at Emana</h1><p style={{ marginBottom: 24 }}>See what needs your attention, then pick up where you left off.</p><Suspense fallback={<p role="status">Loading your overview…</p>}><DashboardContent /></Suspense></div>
}
async function DashboardContent() {
  await requireAdmin()
  let data
  try {
    data = await Promise.all([
      prisma.order.count({ where: { status: { in: ["new", "pending"] } } }),
      prisma.order.count({ where: { status: { in: ["contacted", "quoted", "accepted"] } } }),
      prisma.consultation.count({ where: { status: "requested" } }),
      prisma.product.count(),
      prisma.order.findMany({ where: { status: { notIn: ["completed", "cancelled"] } }, take: 6, orderBy: { createdAt: "desc" }, select: { id: true, name: true, status: true, createdAt: true } }),
      prisma.consultation.findMany({ where: { status: { in: ["requested", "confirmed"] }, date: { gte: new Date().toISOString().slice(0, 10) } }, take: 6, orderBy: { date: "asc" }, select: { id: true, name: true, date: true, status: true } }),
    ])
  } catch { return <section role="alert" className={styles.section}><h2 className={styles.sectionTitle}>Your database needs attention</h2><p>We couldn’t load your business records. This does not mean there are no requests or appointments.</p><p style={{ marginTop: 12 }}>Start the configured PostgreSQL database and run the pending migrations, then refresh this page. No records have been changed.</p><Link href="/admin/social">Manage social links →</Link></section> }
  const [newRequests, openRequests, appointments, productCount, recentRequests, upcoming] = data
    return <>
      <div className={styles.stats}>{[
        { label: "New inquiries", count: newRequests, href: "/admin/orders" },
        { label: "Requests in progress", count: openRequests, href: "/admin/orders" },
        { label: "Appointments to confirm", count: appointments, href: "/admin/consultations" },
        { label: "Products in catalog", count: productCount, href: "/admin/products" },
      ].map(item => <Link key={item.label} href={item.href} className={styles.statCard}><span className={styles.statValue}>{item.count}</span><span className={styles.statLabel}>{item.label}</span></Link>)}</div>
      <section className={styles.section}><div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Customer requests needing attention</h2><Link href="/admin/orders">View requests →</Link></div>{recentRequests.length ? <ul className={styles.taskList}>{recentRequests.map(item => <li key={item.id}><Link href="/admin/orders"><strong>{item.name}</strong><span>{item.status} · #{item.id.slice(0, 8)}</span></Link></li>)}</ul> : <p>No open customer requests.</p>}</section>
      <section className={styles.section}><div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Upcoming appointments</h2><Link href="/admin/consultations">View appointments →</Link></div>{upcoming.length ? <ul className={styles.taskList}>{upcoming.map(item => <li key={item.id}><Link href="/admin/consultations"><strong>{item.name}</strong><span>{item.date} · {item.status}</span></Link></li>)}</ul> : <p>No upcoming appointments.</p>}</section>
      <Link href="/admin/products/new" className="btn-primary">Add a product</Link>
    </>

}
