import "server-only"
import { createHash } from "node:crypto"
import nodemailer from "nodemailer"
import { Resend } from "resend"
import { smtpSettings } from "./mail-config"
import { activeEmailConfig } from "./email-settings"

type Message = { from: string; to: string; subject: string } & ({ text: string; html?: string } | { html: string; text?: string })
export async function sendEmail(payload: Message, idempotencyKey?: string) {
  const active = await activeEmailConfig()
  if (active.provider === "resend") {
    const response = await new Resend(active.apiKey).emails.send(payload, idempotencyKey ? { idempotencyKey } : undefined)
    if (response.error) throw new Error("Email delivery failed")
    return
  }
  const { from, options } = active.smtp, transport = nodemailer.createTransport(options)
  try {
    const domain = from.match(/@([^\s>]+)/)![1]
    const result = await transport.sendMail({ ...payload, from, ...(idempotencyKey ? { messageId: `<${createHash("sha256").update(idempotencyKey).digest("hex")}@${domain}>` } : {}) })
    if (!result.accepted?.length || result.rejected?.length) throw new Error("Recipient was not accepted")
  } catch (error) {
    const code = String((error as { code?: string }).code || "")
    const reason = ["EAUTH", "ETLS", "ESOCKET", "ECONNECTION", "ETIMEDOUT", "EENVELOPE"].includes(code) ? code : "SMTP_REJECTED"
    // SMTP errors can contain mailbox addresses or message data. Log only a safe category.
    console.warn(`SMTP email delivery failed: ${reason}`)
    throw new Error("Email delivery failed")
  } finally { transport.close() }
}

export async function verifyAndTestSmtp(config: ReturnType<typeof smtpSettings>, recipient: string) {
  const transport = nodemailer.createTransport(config.options)
  try {
    await transport.verify()
    const result = await transport.sendMail({ from: config.from, to: recipient, subject: "Emana email setup test", text: "Your Emana email settings passed the SMTP connection test. This message confirms the SMTP server accepted a test email; it contains no sign-in code and does not change your password." })
    if (!result.accepted?.length || result.rejected?.length) throw new Error("Recipient rejected")
  } catch (error) {
    const code = String((error as { code?: string }).code || "")
    if (code === "EAUTH") throw new Error("SMTP sign-in failed. Check the sending email and Google app password.")
    throw new Error("SMTP connection or delivery failed. Check your settings and try again.")
  } finally { transport.close() }
}
