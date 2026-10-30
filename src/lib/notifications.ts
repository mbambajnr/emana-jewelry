import { Resend } from "resend"
import type { CartItem } from "./cart"

const escapeHtml = (value: string) => value.replace(/[<>&"']/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[character]!)
async function sendEmail(payload: Parameters<Resend["emails"]["send"]>[0], idempotencyKey?: string) {
  if (!process.env.RESEND_API_KEY) throw new Error("Email delivery is not configured")
  const response = await new Resend(process.env.RESEND_API_KEY).emails.send(payload, idempotencyKey ? { idempotencyKey } : undefined)
  if (response.error) throw new Error("Email delivery failed")
}
const adminEmail = "emanagold6590@gmail.com"

export async function sendOrderNotification(order: {
  id: string
  name: string
  email: string
  phone: string
  address: string
  notes: string | null
  total: number
  items: CartItem[]
}, idempotencyKey?: string) {
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${escapeHtml(i.name)}${i.metal ? ` — ${escapeHtml(i.metal)}` : ""}</td><td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td></tr>`
    )
    .join("")

  await sendEmail({
    from: "Emana Jewelry <notifications@emanajewelry.com>",
    to: adminEmail,
    subject: `New Quote Request — ${order.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c5a880;">New Quote Request Received</h2>
        <p style="color: #666;">Order #${order.id.slice(0, 8)}</p>

        <h3 style="font-size: 0.9rem; color: #888; margin-top: 24px;">Customer Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #888; font-size: 0.85rem;">Name</td><td style="padding: 6px 0; font-weight: 500;">${escapeHtml(order.name)}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 0.85rem;">Email</td><td style="padding: 6px 0;"><a href="mailto:${escapeHtml(order.email)}">${escapeHtml(order.email)}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 0.85rem;">Phone</td><td style="padding: 6px 0;">${escapeHtml(order.phone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 0.85rem;">Address</td><td style="padding: 6px 0;">${escapeHtml(order.address)}</td></tr>
          ${order.notes ? `<tr><td style="padding: 6px 0; color: #888; font-size: 0.85rem;">Notes</td><td style="padding: 6px 0;">${escapeHtml(order.notes)}</td></tr>` : ""}
        </table>

        <h3 style="font-size: 0.9rem; color: #888; margin-top: 24px;">Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left; font-size: 0.8rem; color: #888;">Item</th>
              <th style="padding: 8px; text-align: center; font-size: 0.8rem; color: #888;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="text-align: right; font-size: 1.1rem; font-weight: 600; margin-top: 16px;">
          Price to be provided by the shop owner after reviewing this request.
        </p>

        <p style="margin-top: 24px; font-size: 0.85rem; color: #888;">
          <a href="https://emanajewelry.com/admin/orders" style="color: #c5a880;">View in Admin</a>
        </p>
      </div>
    `,
  }, idempotencyKey)
}

export async function sendOrderConfirmation(order: {
  name: string
  email: string
  items: CartItem[]
}, idempotencyKey?: string) {
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${escapeHtml(i.name)}${i.metal ? ` — ${escapeHtml(i.metal)}` : ""}</td><td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td></tr>`
    )
    .join("")

  await sendEmail({
    from: "Emana Jewelry <notifications@emanajewelry.com>",
    to: order.email,
    subject: "Quote Request Received — Emana Jewelry",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c5a880;">Thank You, ${escapeHtml(order.name)}!</h2>
        <p>We've received your quote request and will get back to you shortly with pricing and availability.</p>

        <h3 style="font-size: 0.9rem; color: #888; margin-top: 24px;">Items Requested</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left; font-size: 0.8rem; color: #888;">Item</th>
              <th style="padding: 8px; text-align: center; font-size: 0.8rem; color: #888;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="margin-top: 24px; color: #888;">If you have any questions, reply to this email or reach out on WhatsApp.</p>
        <p style="color: #c5a880; font-weight: 500;">— Emana Jewelry</p>
      </div>
    `,
  }, idempotencyKey)
}

export async function sendConsultationNotification(booking: {
  name: string
  email: string
  phone: string | null
  service: string
  format: string
  date: string
  notes: string
}, idempotencyKey?: string) {
  const formattedDate = new Date(booking.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  await sendEmail({
    from: "Emana Jewelry <notifications@emanajewelry.com>",
    to: adminEmail,
    subject: `New Appointment Request — ${booking.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c5a880;">New Appointment Request</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 0.85rem;">Name</td><td style="padding: 8px 0; font-weight: 500;">${escapeHtml(booking.name)}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 0.85rem;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(booking.email)}">${escapeHtml(booking.email)}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 0.85rem;">Phone</td><td style="padding: 8px 0;">${escapeHtml(booking.phone || "—")}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 0.85rem;">Service</td><td style="padding: 8px 0;">${escapeHtml(booking.service)}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 0.85rem;">Format</td><td style="padding: 8px 0;">${escapeHtml(booking.format)}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 0.85rem;">Preferred Date</td><td style="padding: 8px 0;">${formattedDate}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 0.85rem;">Notes</td><td style="padding: 8px 0;">${escapeHtml(booking.notes || "—")}</td></tr>
        </table>
        <p style="margin-top: 24px; font-size: 0.85rem; color: #888;">
          <a href="https://emanajewelry.com/admin/consultations" style="color: #c5a880;">View in Admin</a>
        </p>
      </div>
    `,
  }, idempotencyKey)
}
