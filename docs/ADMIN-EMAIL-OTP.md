# Admin email verification

Admin access now requires the configured email and password, followed by an eight-digit code sent to `ADMIN_EMAIL`. No customer accounts are added. Password-only sessions issued before this release are rejected, so staff need to sign in again after deployment.

## Delivery setup

- Apply the MySQL migration with `npx prisma migrate deploy`, run `npx prisma generate`, then rebuild and restart every app process.
- Set `RESEND_API_KEY` to a working key. The default sender is `Emana Jewelry <notifications@emanajewelry.com>`; that sender domain must be verified in Resend. Set `ADMIN_OTP_FROM` to another verified sender if required.
- `ADMIN_EMAIL` is the only recipient. The address supplied on the login form cannot change the recipient. Confirm the configured mailbox can receive the code before deploying to production.
- If delivery is missing or fails, sign-in stops with an error. There is no password-only fallback or development code printed to logs. The code is not placed in the notification outbox because OTP secrets must not be stored in plaintext.
- Codes are sent only after the correct password is entered or a valid pending browser requests a resend. Automated tests mock email delivery and never send actual admin codes.

## Sign-in behaviour

1. Enter the configured admin email and password. Correct credentials alone do not create a session.
2. Enter the latest email's eight-digit code. The initial challenge expires after 10 minutes, and resending does not extend this deadline.
3. A challenge allows five verification attempts. Resending preserves the attempt count. After expiry or the attempt limit, enter the password again.
4. Wait at least one minute between emails. The account can request at most five code emails in 15 minutes, alongside the existing password limits and code verification limits.
5. The code is tied to the browser's HttpOnly pending cookie. Starting another successful password challenge replaces the previous one. Only one correct concurrent verification can consume a challenge.
6. Refreshing the login page shows the password form again. Use it to start over if necessary; a pending cookie never authorizes admin access.

Only keyed hashes of codes are stored. Pending tokens are hashed in MySQL, and challenges are bound to the current password verifier, email, and session secret. Changing credentials and restarting the app invalidates pending codes and sessions. Old expired challenge rows are cleaned when a new challenge starts. OTP values and raw pending tokens must never be logged or included in analytics.

## Recovery and limits

If the email cannot be reached, use the trusted server administrator to restore email delivery or the configured mailbox. There is no web-accessible bypass. Do not reset credentials or switch the receiving address based solely on a message from someone claiming to be staff. Changes to the receiving email or password need trusted server access and an app restart.

Email verification improves the password-only flow but depends on mailbox security and is not phishing-resistant. Protect the receiving mailbox with strong authentication. See [OWASP's OTP handling guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

Local verification uses mocked email transport and real MySQL for expiry, resend replacement, attempt limits, credential changes, failed delivery, and simultaneous submissions. Inbox delivery still needs a real sign-in by the mailbox owner.
