"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { logout } from "@/app/actions/auth"
import styles from "./layout.module.css"

export default function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  if (pathname === "/admin/login") return <>{children}</>
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Link href="/admin">Emana Admin</Link>
        </div>
        <nav className={styles.nav} aria-label="Admin navigation">
          <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined} className={styles.navLink}>Overview</Link>
          <span className={styles.groupLabel}>Catalog</span>
          <Link href="/admin/products" aria-current={pathname === "/admin/products" ? "page" : undefined} className={styles.navLink}>Products &amp; Media</Link>
          <Link href="/admin/categories" aria-current={pathname === "/admin/categories" ? "page" : undefined} className={styles.navLink}>Collections</Link>
          <span className={styles.groupLabel}>Client Care</span>
          <Link href="/admin/orders" aria-current={pathname === "/admin/orders" ? "page" : undefined} className={styles.navLink}>Customer Requests</Link>
          <Link href="/admin/consultations" aria-current={pathname === "/admin/consultations" ? "page" : undefined} className={styles.navLink}>Appointments</Link>
          <span className={styles.groupLabel}>Reports</span>
          <Link href="/admin/analytics" aria-current={pathname === "/admin/analytics" ? "page" : undefined} className={styles.navLink}>WhatsApp Activity</Link>
          <span className={styles.groupLabel}>Settings</span>
          <Link href="/admin/social" aria-current={pathname === "/admin/social" ? "page" : undefined} className={styles.navLink}>Social Media</Link>
          <Link href="/admin/seo" aria-current={pathname === "/admin/seo" ? "page" : undefined} className={styles.navLink}>Search &amp; SEO</Link>
          <Link href="/" className={styles.navLink}>View Website ↗</Link>
        </nav>
        <div className={styles.spacer} />
        <form action={logout} className={styles.logoutForm}>
          <button type="submit" className={styles.logoutButton}>
            Sign Out
          </button>
        </form>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
