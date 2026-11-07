# Gmail SMTP

Set these private environment values on each app instance:

```dotenv
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-mailbox@gmail.com"
SMTP_PASS="your-google-app-password"
SMTP_FROM="Emana Jewelry <your-mailbox@gmail.com>"
```

Create an app password in the sending Google account at [Google App Passwords](https://myaccount.google.com/apppasswords). Google requires 2-Step Verification for this. Use the app password, not the ordinary Gmail password. Save it directly in the ignored local `.env` or the host's protected environment settings; do not send it in chat or commit it to Git. Spaces in Google's grouped app password are removed only for `smtp.gmail.com` connections.

`SMTP_PASS` must be supplied by the sending mailbox owner. Restart the app after adding it. The recipient for admin codes remains `ADMIN_EMAIL`; changing the email provider does not change the login identity or password.

All SMTP messages use `SMTP_FROM` (or `SMTP_USER` when no From value is configured), including messages whose earlier Resend templates used an Emana-domain sender. Use the authenticated mailbox or an authorized sender alias. Gmail controls sender identity, sending limits, and delivery. The application does not require Resend domain verification when using Gmail SMTP.

Port 465 uses TLS immediately. Port 587 uses required STARTTLS (`SMTP_SECURE=false`). Certificate verification stays enabled, and network timeouts limit stalled requests. Other providers can use the same SMTP settings with their own host, port, and mailbox credentials.

## Failures and retries

Missing SMTP credentials prevent admin codes from being issued. Rejected or failed sends never count as successful delivery. SMTP failures log a safe category such as `EAUTH` or `ETLS`, without raw provider responses, passwords, recipients, or code values. There is no automatic fallback to another mail provider.

Business emails continue through the existing durable notification jobs. SMTP retries use stable Message-ID headers for the same job, but SMTP does not provide a provider idempotency guarantee; an uncertain acknowledgement can still lead to a duplicate. Code emails remain ephemeral and single-use. A successful SMTP acknowledgement does not prove inbox placement.

Resend remains an explicit alternative: use `EMAIL_PROVIDER=resend` and configure `RESEND_API_KEY` plus a verified sender domain. `ADMIN_OTP_FROM` applies to those Resend admin messages; SMTP uses its own From setting.

Sources: [Google app passwords](https://support.google.com/accounts/answer/185833), [Nodemailer SMTP transport](https://nodemailer.com/smtp).
