import { customerWhatsAppLink } from "@/lib/customer-contact"
import RequestWorkflow from "@/components/RequestWorkflow"
import { requireAdmin } from "@/lib/auth"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import styles from "./orders.module.css"

interface CartItem {
  slug: string
  name: string
  image: string
  price: number
  metal?: string
  quantity: number
}

export default function AdminOrders() {
  return (
    <div>
      <Suspense fallback={<p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading orders...</p>}>
        <OrderList />
      </Suspense>
    </div>
  )
}

interface OrderItem {
  id: string
  createdAt: Date
  name: string
  email: string
  phone: string
  address: string
  notes?: string | null
  items: unknown
  total: number
  status: string
}

async function OrderList() {
  await requireAdmin()
  let orders: OrderItem[] = []
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch {
    return <p role="alert">We couldn’t load this information. Check the database connection and migrations, then refresh. No records have been changed.</p>
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Customer Requests</h1>
        <span className={styles.count}>{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p>No customer requests yet.</p>
          <p className={styles.emptyHint}>
            Product inquiries will appear here when clients submit a quote request.
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Request</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Pricing</th>
              <th>Status</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const items = o.items as unknown as CartItem[]
              const itemCount = items.reduce((s, i) => s + i.quantity, 0)
              return (
                <tr key={o.id}>
                  <td className={styles.mono}>
                    {new Date(o.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className={styles.mono}>#{o.id.slice(0, 8)}</td>
                  <td>
                    <div className={styles.nameCell}>{o.name}</div>
                    <a href={`mailto:${o.email}`} className={styles.emailLink}>
                      {o.email}
                    </a>
                  </td>
                  <td>
                    <details className={styles.details}>
                      <summary className={styles.summary}>
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </summary>
                      <ul className={styles.itemList}>
                        {items.map((i) => (
                          <li key={JSON.stringify([i.slug, i.metal])}>
                            {i.name}{i.metal ? ` — ${i.metal}` : ""} × {i.quantity}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td className={styles.total}>Owner to quote</td>
                  <td>
                    <RequestWorkflow kind="inquiry" id={o.id} status={o.status} />
                  </td>
                  <td>
                    <a
                      href={customerWhatsAppLink(o.phone, "Hello, this is Emana Jewelry following up on your request.") || `mailto:${o.email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.waContact}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {customerWhatsAppLink(o.phone, "") ? "WhatsApp" : "Email"}
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
