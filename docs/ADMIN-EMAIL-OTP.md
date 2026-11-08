# Admin email verification

Admin access requires the configured email followed by an eight-digit code sent to `ADMIN_EMAIL`. Daily login does not require the admin password. No customer accounts are added. Sessions issued before this authentication update are rejected, so staff need to sign in again after deployment.

The active password verifier is stored in MySQL. `ADMIN_PASSWORD_HASH` supplies the initial password and a trusted operator recovery path. Ordinary password changes are made in **Admin → Settings → Security & Password**, with the current password and a separate email confirmation code. The new password persists across restarts and deployments without editing server files.

## Forgotten passwords

Use **Manage admin password** on `/admin/login`, or open `/admin/forgot-password`. Enter the configured admin email, then enter the reset code and a new password twice. Recovery does not require the old password. It still requires access to the configured admin mailbox; the form cannot choose another recipient.

Recovery codes are separate from sign-in and password-change codes, with the same 10-minute expiry, five-attempt limit, and resend cooldown. No password, session, or existing login code is changed merely by requesting recovery. A valid reset code is consumed in the same database transaction that replaces the password. Completion revokes existing access and pending codes through the credential version. It does not sign the user in automatically.

Validly formatted email submissions receive the same message and pending-cookie format regardless of whether they match the owner. Account matching and delivery run after the response; public resend and invalid-code responses do not disclose account membership. Shared site, trusted-client (when configured), and address limits constrain requests. The email transport must work; a generic request acknowledgement is not delivery confirmation.

A confirmation email without the password is attempted after a successful reset. That notice is best-effort and does not roll back a completed reset if delivery fails. The normal login and password-change flows still require their own email codes. If the mailbox itself is compromised or unavailable, use the trusted operator recovery procedure below; a web form cannot establish ownership of an inaccessible mailbox.

See [OWASP's password-recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## Delivery setup

- Apply the MySQL migration with `npx prisma migrate deploy`, run `npx prisma generate`, then rebuild and restart every app process.
- Configure Gmail SMTP as described in `EMAIL-SMTP.md`, including a Google app password. Alternatively, select `EMAIL_PROVIDER=resend`, set `RESEND_API_KEY`, and verify the sending domain; the Resend sender defaults to `notifications@emanajewelry.com`, with an optional `ADMIN_OTP_FROM` override.
- Gmail details can be maintained under **Settings → Email Settings**. For initial setup when email codes are unavailable, a trusted operator can issue a separate expiring setup key for `/admin/email-setup`, which also requires the current password and cannot create a session. See `EMAIL-SMTP.md`.
- `ADMIN_EMAIL` is the only recipient. The address supplied on the login form cannot change the recipient. Confirm the configured mailbox can receive the code before deploying to production.
- If delivery is missing or fails, no session is issued. There is no password-only fallback or development code printed to logs. The code is not placed in the notification outbox because OTP secrets must not be stored in plaintext.
- Login requests return the same public response for known and unknown email addresses. Delivery runs after the response and only the configured admin address receives a code. Automated tests mock email delivery and never send actual admin codes.

## Sign-in behaviour

1. Enter the configured admin email. Requesting a code does not create a session.
2. Enter the latest email's eight-digit code. The initial challenge expires after 10 minutes, and resending does not extend this deadline.
3. A challenge allows five verification attempts. Resending preserves the attempt count. After expiry or the attempt limit, enter the email again.
4. Wait at least one minute between emails. The account can request at most five code emails in 15 minutes, alongside the email request limits and code verification limits.
5. The code is tied to the browser's HttpOnly pending cookie. Starting another email challenge replaces the previous one. Only one correct concurrent verification can consume a challenge.
6. Refreshing the login page shows the email form again. Use it to start over if necessary; a pending cookie never authorizes admin access.

Sessions last 12 hours by default. Selecting **Keep me signed in for 7 days** extends the signed session to seven days, without a separate bypass cookie. Sign-out removes the session; password changes revoke both durations.

Only keyed hashes of codes are stored. Pending tokens are hashed in MySQL, and challenges are bound to the current password verifier, email, and session secret. Password changes immediately invalidate older sessions and pending codes on the next authorization check. Server configuration changes require every app process to restart with the same environment. Old expired challenge rows are cleaned when a new challenge starts. OTP values and raw pending tokens must never be logged or included in analytics.

Password-change codes are separate from login codes and cannot substitute for them. The pending new password is salted and hashed before staging; its verifier is bound to the challenge. Confirmation consumes the code and changes the password in one database transaction. Concurrent or repeated confirmations cannot apply another password. The current password remains valid if confirmation or email delivery fails.

## Recovery and limits

If the email cannot be reached, use the trusted server administrator to restore email delivery or the configured mailbox. There is no web-accessible OTP bypass. Do not reset credentials or switch the receiving address based solely on a message from someone claiming to be staff.

For operator password recovery, generate a fresh password/hash with `npm run admin:credentials`, replace `ADMIN_PASSWORD_HASH`, and restart every app instance with the same environment. A changed bootstrap hash deliberately resets the stored verifier on the next credential read. Keep that environment value unchanged for ordinary deployments so an admin's saved password is retained. Changing `ADMIN_EMAIL` selects a different configured identity; a new address starts from the bootstrap password unless it already has a credential record. Session-secret rotation preserves the active database password. Include the credential table in protected database backups.

Passwordless email access depends on mailbox security and is not phishing-resistant. Protect the receiving mailbox with strong authentication. See [OWASP's OTP handling guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

Local verification uses mocked email transport and real MySQL for expiry, resend replacement, attempt limits, credential changes, failed delivery, and simultaneous submissions. Inbox delivery still needs a real sign-in by the mailbox owner.
