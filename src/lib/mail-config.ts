import "server-only"

export function emailProvider(): "smtp" | "resend" {
  const value = process.env.EMAIL_PROVIDER || "resend"
  if (value !== "smtp" && value !== "resend") throw new Error("Set EMAIL_PROVIDER to smtp or resend")
  return value
}
export type SmtpValues = { host: string; user: string; password: string; port: number; secure: boolean; from: string }
export function smtpSettings(values?: SmtpValues) {
  const host = values?.host || process.env.SMTP_HOST?.trim(), user = values?.user || process.env.SMTP_USER?.trim(), password = values?.password ?? process.env.SMTP_PASS
  if (!host || !/^[a-zA-Z0-9.-]+$/.test(host) || !user || /[\r\n]/.test(user) || !password) throw new Error("Configure SMTP_HOST, SMTP_USER, and SMTP_PASS")
  const port = values?.port ?? Number(process.env.SMTP_PORT || 465)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT must be a valid port")
  const configuredSecure = values ? String(values.secure) : process.env.SMTP_SECURE
  if (configuredSecure && !["true", "false"].includes(configuredSecure)) throw new Error("SMTP_SECURE must be true or false")
  const secure = configuredSecure ? configuredSecure === "true" : port === 465
  if ((port === 465 && !secure) || (port === 587 && secure)) throw new Error("Use TLS on port 465 or STARTTLS on port 587")
  const from = values?.from || process.env.SMTP_FROM?.trim() || user
  if (from.length > 320 || /[\r\n]/.test(from) || !/^[^<>\r\n]*<?[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>?$/.test(from)) throw new Error("Configure a valid SMTP_FROM address")
  return {
    from,
    options: {
      host, port, secure, requireTLS: !secure,
      auth: { user, pass: host === "smtp.gmail.com" ? password.replace(/\s/g, "") : password },
      tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" as const },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
      disableFileAccess: true, disableUrlAccess: true,
    },
  }
}
export function assertEmailConfigured() {
  if (emailProvider() === "smtp") { smtpSettings(); return }
  if (!process.env.RESEND_API_KEY) throw new Error("Configure RESEND_API_KEY")
}
