export type AdminCodePurpose = "login" | "password-change" | "password-reset"
const escape = (value: string) => value.replace(/[<>&"']/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[character]!)
const content = {
  login: { action: "sign-in", heading: "Welcome back.", intro: "Enter this code on the Emana admin sign-in page to access your dashboard.", label: "YOUR SIGN-IN CODE" },
  "password-change": { action: "password change", heading: "Confirm your password change.", intro: "Enter this code in Security settings to confirm your new admin password.", label: "PASSWORD CHANGE CODE" },
  "password-reset": { action: "password reset", heading: "Reset your admin password.", intro: "Enter this code on the password recovery page to set a new admin password.", label: "PASSWORD RESET CODE" },
} satisfies Record<AdminCodePurpose, { action: string; heading: string; intro: string; label: string }>

export function adminCodeEmail(code: string, expiresAt: Date, purpose: AdminCodePurpose = "login") {
  const copy = content[purpose]
  const expiry = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(expiresAt) + " GMT"
  const subject = `Your Emana admin ${copy.action} code`
  const text = `EMANA JEWELRY\n\n${copy.heading}\n${copy.intro}\n\n${code}\n\nUse before ${expiry}. Only the latest code works, and it can be used once.\n\nKeep this code private. If you did not request it, do not use or share it. Contact your site administrator.\n\nEmana Jewelry · Admin access`
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="format-detection" content="telephone=no"><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#f5f1eb;color:#30251f;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Your ${escape(copy.action)} code for Emana admin. Use it before ${escape(expiry)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1eb;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#ffffff;border:1px solid #e6ded2;border-radius:12px;overflow:hidden;">
<tr><td style="background-color:#2b1b16;padding:30px 28px;border-bottom:3px solid #b99b62;">
<p style="margin:0;color:#ead9b8;font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:5px;line-height:1.3;">EMANA</p><p style="margin:8px 0 0;color:#e6dacf;font-size:11px;letter-spacing:3px;line-height:1.5;">JEWELRY · ADMIN ACCESS</p></td></tr>
<tr><td style="padding:32px 24px;">
<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.3;font-weight:normal;color:#30251f;">${escape(copy.heading)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#62564d;">${escape(copy.intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d9c6a0;background-color:#faf6ee;border-radius:8px;"><tr><td align="center" style="padding:22px 12px;">
<p style="margin:0 0 10px;font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#70582e;">${escape(copy.label)}</p>
<p style="margin:0;color:#30251f;font-family:'Courier New',monospace;font-size:30px;line-height:1.5;font-weight:bold;letter-spacing:4px;white-space:nowrap;">${escape(code)}</p>
</td></tr></table>
<p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#62564d;"><strong style="color:#30251f;">Use before ${escape(expiry)}.</strong><br>Only the latest code works, and it can be used once.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #eee7dd;"><tr><td style="padding-top:20px;"><p style="margin:0;font-size:13px;line-height:1.7;color:#71665d;">Keep this code private. If you did not request it, do not use or share it. Contact your site administrator.</p></td></tr></table>
</td></tr></table>
<p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#776b60;">Emana Jewelry<br>This email is for admin access, not a customer order.</p>
</td></tr></table></body></html>`
  return { subject, text, html }
}
