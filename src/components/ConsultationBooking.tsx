"use client"

import { submissionKey } from "@/lib/submission-key"

import { useSiteContent } from "@/components/cms/SiteContentProvider"
import { bookableServices, serviceValue, serviceLabel } from "@/lib/site-content"
import { useRef, useState, useEffect, useMemo, type FormEvent } from "react"
import styles from "./ConsultationBooking.module.css"

interface FormData {
  name: string
  email: string
  phone: string
  service: string
  notes: string
  format: string
  date: string
}

interface FormErrors {
  name?: string
  email?: string
  service?: string
  format?: string
  date?: string
}

const formats = [
  "Private Atelier (Takoradi - Justmoh Ave)",
  "WhatsApp Concierge Video Consultation",
]

const formatAndLegacyLabels: Record<string, string> = {
  "Bespoke Design Walkthrough (30 Mins)": "Talk About Your Custom Design (30 Mins)",
  "Gemstone Sourcing Consultation (45 Mins)": "Help Choosing Gemstones (45 Mins)",
  "Metal Sizing & Scaling Analysis (30 Mins)": "Help With Sizing and Materials (30 Mins)",
  "Jewelry Cleaning & Deep Detailing (30 Mins)": "Jewelry Cleaning & Polishing (30 Mins)",
  "Resizing & Repair Assessment (45 Mins)": "Ring Sizing & Repair Advice (45 Mins)",
  "Antique Restoration Consultation (60 Mins)": "Care for Old & Family Jewelry (60 Mins)",
  "Private Atelier (Takoradi - Justmoh Ave)": "Visit Our Takoradi Shop (Justmoh Ave)",
  "WhatsApp Concierge Video Consultation": "WhatsApp Video Call"
}

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split("T")[0]
}

export default function ConsultationBooking() {
  const { services: registry, preview } = useSiteContent()
  const available = useMemo(() => bookableServices({ copy: {}, faqs: [], services: registry }), [registry])
  const services = useMemo(() => available.map(serviceValue), [available])
  const customService = available.find(service => service.kind === "custom")
  const customValue = customService ? serviceValue(customService) : services[0] || ""
  const bookingLabels = { ...formatAndLegacyLabels, ...Object.fromEntries(available.map(service => [serviceValue(service), serviceLabel(service)])) }
  const isCareOrRepair = (value: string) => available.find(service => serviceValue(service) === value)?.kind === "care"

  const [minDate, setMinDate] = useState("")
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    service: services[0] || "",
    notes: "",
    format: formats[0],
    date: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [serverError, setServerError] = useState("")

  useEffect(() => {
    const tomorrowStr = tomorrow()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinDate(tomorrowStr)
    setForm((prev) => (prev.date ? prev : { ...prev, date: tomorrowStr }))
  }, [])

  useEffect(() => {
    const selectCustomDesign = () => {
      setForm(previous => ({ ...previous, service: customValue }))
      setStatus("idle")
      setServerError("")
      setErrors(previous => ({ ...previous, service: undefined }))
    }
    const onHashChange = () => { if (window.location.hash === "#custom-jewelry-form") selectCustomDesign() }
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const link = event.target.closest("a")
      if (link && link.origin === window.location.origin && link.pathname === "/" && link.hash === "#custom-jewelry-form") selectCustomDesign()
    }
    const timer = setTimeout(onHashChange, 0)
    window.addEventListener("hashchange", onHashChange)
    document.addEventListener("click", onClick)
    return () => { clearTimeout(timer); window.removeEventListener("hashchange", onHashChange); document.removeEventListener("click", onClick) }
  }, [customValue])

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      if (field in next) delete (next as Record<string, string | undefined>)[field]
      return next
    })
  }

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = "Full name is required"
    if (!form.email.trim()) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address"
    if (!services.includes(form.service)) errs.service = "Select a service"
    if (!form.format.trim()) errs.format = "Select an appointment format"
    if (!form.date.trim()) errs.date = "Select a preferred date"
    else if (form.date < tomorrow()) errs.date = "Date must be in the future"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const requestRef = useRef<{ body: string; key: string } | null>(null)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (preview || !validate()) return

    setStatus("submitting")
    setServerError("")

    try {
      const body = JSON.stringify({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, service: form.service, notes: form.notes.trim(), format: form.format, date: form.date })
      requestRef.current = submissionKey(requestRef.current, body)
      const res = await fetch("/api/consultations", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestRef.current.key }, body })

      const data = await res.json()
      if (!res.ok) {
        setServerError(data.errors?.join(", ") || "Something went wrong")
        setStatus("error")
        return
      }

      setStatus("success")
    } catch {
      setServerError("Unable to reach the server. Please try again.")
      setStatus("error")
    }
  }

  if (status === "success") {
    const waMessage = `Hi Emana Jewelry, I've booked a ${(bookingLabels[form.service] || form.service).toLowerCase()} on ${new Date(form.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. I'd like to confirm my appointment details.`
    const waHref = `https://wa.me/233242186590?text=${encodeURIComponent(waMessage)}`

    return (
      <div id="custom-jewelry-form" className={`${styles.card} glass-panel`}>
        <div className={styles.success}>
          <div className={styles.successIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className={styles.successTitle}>Request Received</h3>
          <p className={styles.successDesc}>
            Thank you, {form.name.split(" ")[0]}. Your {(bookingLabels[form.service] || form.service).toLowerCase()} has been requested for <strong>{new Date(form.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>.
          </p>
          <p className={styles.successNote}>
            We’ll contact you to agree on a time. Your appointment is confirmed only after you hear from our team. For urgent requests, speak with us on WhatsApp.
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waSuccessBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Confirm via WhatsApp
          </a>
          <button
            className={styles.resetBtn}
            onClick={() => {
              setStatus("idle")
              setForm({
                name: "", email: "", phone: "", service: services[0] || "", notes: "", format: formats[0], date: tomorrow(),
              })
            }}
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div id="custom-jewelry-form" className={`${styles.card} glass-panel`}>
      <h3 className={styles.title}>Book a Visit or Call</h3>

      <a
        href="https://wa.me/233242186590?text=Hi%20Emana%20Jewelry%2C%20I'd%20like%20to%20book%20a%20private%20appointment."
        target="_blank"
        rel="noopener noreferrer"
        className={styles.waBanner}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Book directly via WhatsApp
      </a>

      <p className={styles.formHint}>Choose a service and a day that suits you. You can also book directly on WhatsApp.</p>
      {preview && <p role="status">Draft preview — appointments cannot be submitted here.</p>}
      {services.length === 0 && <p role="status">Please contact us on WhatsApp to arrange a service.</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Name */}
        <div className={styles.field}>
          <label htmlFor="booking-name" className={styles.label}>Full Name</label>
          <input
            type="text"
            className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
            placeholder="Your full name"
            autoComplete="name"
            id="booking-name"
            name="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "booking-name-error" : undefined}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          {errors.name && <span id="booking-name-error" role="alert" className={styles.fieldError}>{errors.name}</span>}
        </div>

        {/* Email */}
        <div className={styles.field}>
          <label htmlFor="booking-email" className={styles.label}>Email Address</label>
          <input
            type="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            placeholder="you@example.com"
            autoComplete="email"
            id="booking-email"
            name="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "booking-email-error" : undefined}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          {errors.email && <span id="booking-email-error" role="alert" className={styles.fieldError}>{errors.email}</span>}
        </div>

        {/* Phone */}
        <div className={styles.field}>
          <label htmlFor="booking-phone" className={styles.label}>Phone Number <span className={styles.optional}>(Optional)</span></label>
          <input
            type="tel"
            className={styles.input}
            placeholder="024 123 4567"
            autoComplete="tel"
            id="booking-phone"
            name="phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>

        {/* Service */}
        <div className={styles.field}>
          <label htmlFor="booking-service" className={styles.label}>What Can We Help You With?</label>
          <select
            className={`${styles.select} ${errors.service ? styles.inputError : ""}`}
            id="booking-service"
            name="service"
            aria-invalid={!!errors.service}
            aria-describedby={errors.service ? "booking-service-error" : undefined}
            value={form.service}
            onChange={(e) => update("service", e.target.value)}
          >
            {services.map((s) => (
              <option key={s} value={s}>{bookingLabels[s]}</option>
            ))}
          </select>
          {errors.service && <span id="booking-service-error" role="alert" className={styles.fieldError}>{errors.service}</span>}
        </div>

        {/* Dynamic Notes */}
        {isCareOrRepair(form.service) ? (
          <div className={styles.field}>
            <label htmlFor="booking-notes" className={styles.label}>Tell Us About Your Jewelry</label>
            <textarea
              className={styles.textarea}
              placeholder="For example: My ring is too tight, my chain is broken, or a stone has come loose."
              id="booking-notes"
            name="notes"
            value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
        ) : (
          <div className={styles.field}>
            <label htmlFor="booking-notes" className={styles.label}>Tell Us Your Idea <span className={styles.optional}>(Optional)</span></label>
            <input
              type="text"
              className={styles.input}
              placeholder="For example: I’d like a gold necklace made as a birthday gift."
              id="booking-notes"
            name="notes"
            value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
        )}

        {/* Format */}
        <div className={styles.field}>
          <label htmlFor="booking-format" className={styles.label}>How Would You Like to Meet?</label>
          <select
            className={`${styles.select} ${errors.format ? styles.inputError : ""}`}
            id="booking-format"
            name="format"
            aria-invalid={!!errors.format}
            aria-describedby={errors.format ? "booking-format-error" : undefined}
            value={form.format}
            onChange={(e) => update("format", e.target.value)}
          >
            {formats.map((f) => (
              <option key={f} value={f}>{bookingLabels[f]}</option>
            ))}
          </select>
          {errors.format && <span id="booking-format-error" role="alert" className={styles.fieldError}>{errors.format}</span>}
        </div>

        {/* Date */}
        <div className={styles.field}>
          <label htmlFor="booking-date" className={styles.label}>Preferred Date</label>
          <input
            type="date"
            className={`${styles.input} ${errors.date ? styles.inputError : ""}`}
            id="booking-date"
            name="date"
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? "booking-date-error" : undefined}
            value={form.date}
            min={minDate}
            onChange={(e) => update("date", e.target.value)}
          />
          {errors.date && <span id="booking-date-error" role="alert" className={styles.fieldError}>{errors.date}</span>}
        </div>

        {serverError && (
          <div role="alert" className={styles.serverError}>{serverError}</div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={preview || services.length === 0 || status === "submitting"}
        >
          {status === "submitting" ? (
            <><span className={styles.spinner} aria-hidden="true" /> Sending your request…</>
          ) : (
            "Request an Appointment"
          )}
        </button>
      </form>
    </div>
  )
}
