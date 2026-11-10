# Gmail SMTP

## Configure from the admin

Open **Admin → Settings → Email Settings**. Enter the Gmail sending address and Google app password, confirm your current admin password, then choose **Save & Send Test Email**. The app checks the connection and sends only to the configured admin mailbox before committing the settings. An SMTP acknowledgement is not proof of inbox placement.

Saved app passwords are encrypted with AES-256-GCM in MySQL using the server-only `EMAIL_SETTINGS_KEY`. The browser receives only metadata and a `passwordSet` flag, never the password or encrypted value. Leave the app-password field blank to retain the saved secret when the account and connection are unchanged. Account or connection changes require entering it again. Saves use version checks, and invalid settings or failed tests leave the existing configuration intact. Saved settings take effect without restarting the app and override the environment mail provider for that owner.

This page supports Gmail and Google Workspace through `smtp.gmail.com`, using port 465 with TLS or 587 with required STARTTLS. Custom SMTP providers remain available through server environment configuration. The web form cannot connect to arbitrary hosts.

## First setup or email outage

If admin email is unavailable, an operator can issue narrowly scoped setup access:

1. Apply migrations and generate Prisma. Set `EMAIL_SETTINGS_KEY` once to 32 random bytes in base64. Keep this key in protected server settings across deployments, and back it up separately from the database. Do not reuse the session secret; rotating login credentials should not break email decryption.
2. Run `node --env-file=.env scripts/create-email-setup-key.mjs` in the project folder. This prints a new key valid for 30 minutes and revokes previously unused keys for that owner. Do not publish the key or place it in a URL. It is stored only as a hash, allows five attempts, and can be consumed once.
3. Open `/admin/email-setup`. Enter the setup key, current admin password, Gmail address, and Google app password. Both the setup key and the current password are required; this route never creates an admin session or changes the login identity/password.
4. After Gmail accepts the test and the settings are saved, the key is consumed atomically. Return to sign-in and request a fresh email code. Subsequent changes use the normal admin settings page.

An expired or exhausted setup key must be reissued by the trusted operator. A failed SMTP test does not consume the key, but counts as an attempt. Setup access is not enabled merely by knowing the admin password or by causing email delivery to fail. There is no public key-generation endpoint. A changed admin password during a save prevents stale authorization from committing settings.

## Environment alternative

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

## Official shop mailbox

The public business address and intended admin/notification inbox are `emanajewelries@gmail.com`; the production origin is `https://emanajewelries.com`. Public content uses the CMS business email; the notification destination is `SHOP_NOTIFICATION_EMAIL`, and login/recovery codes use `ADMIN_EMAIL`.

Changing a recipient does not authenticate a different Gmail sender. To send as the official account, enter `emanajewelries@gmail.com` and a Google App Password created by that account in Admin → Email Settings. Do not reuse the old account's App Password or set only the From header. The existing working SMTP sender may be retained during this transition; reply addresses and notification recipients can already use the official inbox. No email is sent by this documentation update.

Admin credentials and encrypted SMTP records are keyed by the configured admin email. Preserve/migrate the active password and re-encrypt saved SMTP credentials with the new owner-bound encryption context before changing an existing identity. Simply editing ADMIN_EMAIL without that migration selects a different identity. The local identity migration has been completed; it does not configure the separate OrangeHost environment. Keep passwords and SMTP secrets out of Git and chat.
