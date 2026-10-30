"use client"

import { submissionKey } from "@/lib/submission-key"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { getCart, removeFromCart, updateQuantity, clearCart, type CartItem } from "@/lib/cart"
import {
  buildOrderConciergeMessage,
  getWhatsAppConciergeUrl,
  trackConciergeClick,
  CONCIERGE_DISPLAY_PHONE,
  CONCIERGE_HOURS,
} from "@/lib/concierge"
import styles from "./page.module.css"

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [checkoutMode, setCheckoutMode] = useState<"choose" | "whatsapp" | "form">("choose")
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [submittedSummary, setSubmittedSummary] = useState<{
    name: string
    phone: string
    items: CartItem[]
    total: number
  } | null>(null)
  const requestRef = useRef<{ body: string; key: string } | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const handler = () => setItems(getCart())
    window.addEventListener("cart", handler)
    setTimeout(handler, 0)
    return () => window.removeEventListener("cart", handler)
  }, [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const buildWhatsAppMessage = () => {
    return getWhatsAppConciergeUrl(
      buildOrderConciergeMessage({
        items,
        total,
      })
    )
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const body = JSON.stringify({ ...form, items: items.map(item => ({ slug: item.slug, quantity: item.quantity, ...(item.metal ? { metal: item.metal } : {}) })) })
      requestRef.current = submissionKey(requestRef.current, body)
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestRef.current.key },
        body,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request")
      }
      setSubmittedSummary({ name: form.name, phone: form.phone, items: [...items], total })
      setCreatedOrderId(data.id ?? null)
      clearCart()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    const waFollowUpUrl = submittedSummary && createdOrderId
      ? getWhatsAppConciergeUrl(
          buildOrderConciergeMessage({
            orderId: createdOrderId,
            customerName: submittedSummary.name,
            customerPhone: submittedSummary.phone,
            items: submittedSummary.items,
            total: submittedSummary.total,
          })
        )
      : null

    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="1">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h2 className={styles.successTitle}>Request Received!</h2>
              {createdOrderId && (
                <p style={{ color: "var(--gold-primary)", fontWeight: 600, letterSpacing: "1px", margin: "0.5rem 0" }}>
                  Reference Order #{createdOrderId.slice(0, 8).toUpperCase()}
                </p>
              )}
              <p>Thank you for getting in touch. Your request has been received.</p>
              <p className={styles.successSub}>We’ll review your request and contact you with the details. No payment has been taken.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem", alignItems: "center" }}>
                {waFollowUpUrl && (
                  <a
                    href={waFollowUpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.browseBtn}
                    style={{ background: "var(--gold-primary)", color: "#000", border: "none" }}
                    onClick={() => trackConciergeClick("/cart", "order_success_whatsapp_click")}
                  >
                    Chat With Us on WhatsApp (Order #{createdOrderId?.slice(0, 8).toUpperCase()})
                  </a>
                )}
                <Link href="/collections" className={styles.browseBtn}>
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Request Quote</h1>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p>Your list is empty.</p>
              <Link href="/collections" className={styles.browseBtn}>
                Browse Collections
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.items}>
                {items.map((item) => (
                  <div key={JSON.stringify([item.slug, item.metal])} className={styles.item}>
                    <Link href={`/products/${encodeURIComponent(item.slug)}`} className={styles.itemImageLink}>
                      <div className={styles.itemImageWrapper}>
                        <Image src={item.image} alt={item.name} fill className={styles.itemImage} />
                      </div>
                    </Link>
                    <div className={styles.itemBody}>
                      <Link href={`/products/${encodeURIComponent(item.slug)}`} className={styles.itemName}>
                        {item.name}
                      </Link>
                      {item.metal && <p>Metal: {item.metal}</p>}
                      <div className={styles.itemControls}>
                        <div className={styles.qtyControl}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.slug, item.quantity - 1, item.metal)}
                            aria-label={`Decrease quantity for ${item.name}${item.metal ? ` in ${item.metal}` : ""}`}
                          >
                            &minus;
                          </button>
                          <span className={styles.qtyValue}>{item.quantity}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.slug, item.quantity + 1, item.metal)}
                            aria-label={`Increase quantity for ${item.name}${item.metal ? ` in ${item.metal}` : ""}`}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.slug, item.metal)}
                          aria-label={`Remove ${item.name}${item.metal ? ` in ${item.metal}` : ""}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.summary}>
                <p className={styles.itemCount}>
                  {itemCount} {itemCount === 1 ? "item" : "items"} for quote
                </p>

                {checkoutMode === "choose" && (
                  <div className={styles.checkoutOptions}>
                    <p className={styles.checkoutLabel}>Choose how to request a quote</p>
                    <button
                      className={styles.whatsappCheckoutBtn}
                      onClick={() => setCheckoutMode("whatsapp")}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Send Your Request on WhatsApp
                    </button>
                    <button
                      className={styles.emailCheckoutBtn}
                      onClick={() => setCheckoutMode("form")}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      Request via Email
                    </button>
                    <button className={styles.backBtn} onClick={() => clearCart()}>
                      Clear List
                    </button>
                  </div>
                )}

                {checkoutMode === "whatsapp" && (
                  <div className={styles.checkoutActions}>
                    <div style={{ textAlign: "left", marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      <p style={{ fontWeight: 600, color: "var(--gold-primary)", marginBottom: "0.25rem" }}>
                        Speak With Our Team ({CONCIERGE_DISPLAY_PHONE})
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{CONCIERGE_HOURS}</p>
                      <p style={{ marginTop: "0.5rem" }}>
                        Speak with us on WhatsApp about sizes, materials, available certificates, payment, or delivery.
                      </p>
                    </div>
                    <a
                      href={buildWhatsAppMessage()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.checkoutBtn}
                      onClick={() => trackConciergeClick("/cart", "cart_checkout_whatsapp_click")}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Chat With Us on WhatsApp
                    </a>
                    <button className={styles.backBtn} onClick={() => setCheckoutMode("choose")}>
                      Back
                    </button>
                  </div>
                )}

                {checkoutMode === "form" && (
                  <form className={styles.form} onSubmit={handleFormSubmit}>
                    <p className={styles.formTitle}>Your Details</p>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="Full Name *"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="Email *"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <input
                      className={styles.input}
                      type="tel"
                      placeholder="Phone Number *"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <textarea
                      className={styles.textarea}
                      placeholder="Delivery Address *"
                      required
                      rows={3}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                    <textarea
                      className={styles.textarea}
                      placeholder="Additional Notes (optional)"
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                    {error && <p className={styles.error}>{error}</p>}
                    <div className={styles.formActions}>
                      <button className={styles.submitBtn} type="submit" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Quote Request"}
                      </button>
                      <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => setCheckoutMode("choose")}
                      >
                        Back
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
