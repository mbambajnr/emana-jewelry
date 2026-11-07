import "server-only"
import { createHash } from "node:crypto"
import nodemailer from "nodemailer"
import { Resend } from "resend"
import { assertEmailConfigured, emailProvider, smtpSettings } from "./mail-config"

type Message = { from: string; to: string; subject: string } & ({ text: string; html?: string } | { html: string; text?: string })
export async function sendEmail(payload: Message, idempotencyKey?: string) {
  assertEmailConfigured()
  if (emailProvider() === "resend") {
    const response = await new Resend(process.env.RESEND_API_KEY).emails.send(payload, idempotencyKey ? { idempotencyKey } : undefined)
    if (response.error) throw new Error("Email delivery failed")
    return
  }
  const { from, options } = smtpSettings(), transport = nodemailer.createTransport(options)
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
