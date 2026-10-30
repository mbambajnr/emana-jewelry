# Audit fixes and production configuration

Implemented against the 30 October 2026 application audit on the MySQL branch.

## Application changes

- Next.js 16.4.3, React 19.3.1, Prisma 7.10.1, and MariaDB connector 3.5.4. The adapter resolves the patched connector too. Prisma CLI is a development/build dependency. The completed npm audit reports zero vulnerabilities at verification time; that is not a guarantee against future advisories.
- Persistent filesystem images in development and production, controlled by `PRODUCT_IMAGE_DIRECTORY`. Existing public photo URLs stay unchanged. File signatures, supported extensions, size limits, and traversal restrictions are enforced. Supabase is an explicit optional storage mode, not an implicit production dependency.
- MySQL-backed shared rate limits and bounded public JSON submissions. Proxy-provided client identity is used only when `TRUSTED_CLIENT_IP_HEADER` is explicitly configured.
- Login attempts are throttled, password derivation is asynchronous, and signed sessions are bound to the configured password verifier. Changing `ADMIN_PASSWORD_HASH` and restarting all app instances invalidates old cookies. Existing pre-update cookies also require sign-in again. A session secret of at least 32 characters is required.
- Product updates require the version read by the editor. Conflicts return 409 and preserve the unsaved form. Omitted galleries, materials, stones, details, video, and subcategory are preserved; explicit empty arrays clear a section. Product payloads have field/array bounds.
- Enquiries and appointments require an idempotency reference. Browser forms generate it and reuse it for retries of the same body. The server compares a normalized payload fingerprint, returns an existing reference for a replay, and rejects a reused key with different details. Unique database keys handle concurrent replays. A reload or deliberately new key is a new submission, not a global duplicate guarantee.
- Alternate-cased product references resolve to canonical slugs; duplicate canonical product/metal selections are rejected. Quote snapshots use the selected metal's image.
- Email jobs are committed in the same transaction as the business request. They use worker leases, bounded exponential backoff, stable provider idempotency keys, and an admin retry/status page. Email sender details remain those already configured for Emana.
- The inactive newsletter form was removed. No email addresses are collected without a subscription workflow. The generic certificate question was removed from multi-product enquiry copy.
- Social links and search verification settings now use MySQL in both modes. Their origin checks share the central validator. The existing local settings files were empty during the audit; they were retained. Other installations with configured legacy files should re-save those values through the admin before deployment.

## Deploy the code and schema together

Back up the MySQL database and photo directory first. On the build/migration machine:

```sh
npm ci --include=dev
npx prisma generate
npx prisma migrate deploy
npm run build
```

This applies `20261030120000_audit_fixes`: product versions, submission identity fields, rate buckets, and the notification outbox. It preserves existing business records. Apply migrations before starting this release; login/submissions fail closed if the rate-limit table is unavailable. New jobs cover new requests; old historical enquiries are not automatically emailed.

## OrangeHost photo directory

Create a writable directory **outside the application checkout**, for example `/home/ACCOUNT/emana-media`, owned by the same account running Node. Set:

```dotenv
PRODUCT_IMAGE_DIRECTORY="/home/ACCOUNT/emana-media"
IMAGE_STORAGE="filesystem"
```

Retain and back up this directory across code updates. Do not copy the Mac's local directory value to OrangeHost. The local environment was configured with a separate `Emana Jewelry Media` directory beside the checkout, and all 35 source image files were copied and compared byte-for-byte; the originals remain in `.data/product-images`. The catalogue's 34 image references were not rewritten.

To copy legacy images on a machine where `.data/product-images` is present:

```sh
node --env-file=.env scripts/migrate-image-storage.mjs
node --env-file=.env scripts/migrate-image-storage.mjs --copy
```

The first command is a dry run. The copy refuses to overwrite a differing destination file and can be resumed safely. Verify originals and optimized thumbnails after restarting in production mode and again after redeploying. Keep photo files and database URLs consistent when restoring backups. Install optional native image dependencies for the actual deployment platform.

## Trusted proxy identity and limits

Ask OrangeHost which client-address header their proxy **overwrites**. Only then set `TRUSTED_CLIENT_IP_HEADER` to that header name. Do not blindly trust a forwarding header that visitors can supply.

Current 15-minute limits:

| Scope | Site-wide | Per trusted client |
| --- | ---: | ---: |
| Login | 50 | 12, plus 8 per normalized account |
| Enquiries | 30 without trusted client identity; 200 with it | 10 |
| Appointments | 30 without trusted client identity; 200 with it | 10 |
| Analytics | 2,000 | 100 |
| Staff mail retries | 10 per staff account | — |

Rate keys are HMACs; raw IP addresses and login emails are not stored in rate buckets. Same-origin checks supplement these limits, not replace them. Review real traffic before changing thresholds. Confirm that proxy host/protocol handling and HTTPS work correctly on the actual account.

## Email delivery and retries

Open **Admin → Client Care → Email Delivery** to inspect pending, working, failed, and sent jobs and retry eligible failures. “Sent” means the email provider accepted the API request, not confirmed inbox delivery. Original enquiries remain in Customer Requests/Appointments regardless of email status.

Initial processing runs after a successful submission. To recover automatically after an app restart or a quiet period, configure a host scheduler to make an HTTPS **POST** to `/api/jobs/notifications` with:

```text
Authorization: Bearer YOUR_SEPARATE_RANDOM_SECRET
```

Set `NOTIFICATION_CRON_SECRET` to that random value (at least 32 characters). Keep it in the scheduler's protected environment/header configuration, never the URL, Git, chat, or a public log. The endpoint is disabled until configured. For OrangeHost shared hosting, use an interval supported by the plan; do not assume minute-by-minute jobs are allowed. A 20-minute interval can be used if supported by the account.

The runner claims at most 30 jobs per call, uses two-minute leases, and automatically attempts a job at most five times. Expired final attempts become failed for staff review. Old rate-limit buckets are cleaned by the runner. Monitor pending jobs and scheduler health. Provider idempotency has a limited retention window; a manual retry after a prolonged outage can still result in a duplicate if the earlier delivery outcome was unknown. Exactly-once inbox delivery is not claimed.

No provider emails or WhatsApp messages were sent during automated verification; notification tests use mocks and clean up their database fixtures.

## Hosting acceptance remains required

Local verification on 30 October 2026: 190 tests passed, including two MySQL integration tests; lint, TypeScript checks, and the production build passed. Production storefront smoke checks reported no blockers in the tested routes, and all four sampled product image responses returned HTTP 200. The production dependency audit reported zero known vulnerabilities. The notification admin endpoint rejected anonymous access, and the scheduler endpoint stayed disabled without its secret.

These fixes do not provision or change the OrangeHost account. Confirm Node and MySQL versions, process supervision, memory limits, HTTPS/proxy configuration, persistent-directory permissions, email sender verification, scheduler execution, and a database-plus-files restore. A local production response time is not a mobile-network performance result.
