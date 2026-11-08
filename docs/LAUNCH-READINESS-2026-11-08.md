# Launch readiness audit — 8 November 2026

Audited release: `907d802`, local production app at localhost:3000 with MySQL. Verdict: suitable for staging; do not approve unrestricted public launch yet. OrangeHost is paid for but its actual account/runtime has not been inspected or deployed in this audit.

## Findings, ordered by priority

1. **P2 — Catalogue fallbacks bypass database authority (audit correction).** `src/app/products/[slug]/page.tsx:115` falls back to static products whenever the database returns null, including a successful lookup of a deleted product. Metadata does the same at line 67. `src/app/api/products/route.ts:15` and `src/lib/sitemap.ts:22` replace an empty database catalogue with samples. Correction during implementation: the current static product array is empty, so deleted sample products reappearing was a latent code-path risk, not an observed behaviour on this release. Static collection entries do exist and can replace an empty collection list. The original audit overstated the immediate product impact. Remove production sample fallback; distinguish a missing record from a database outage and return appropriate unavailable/not-found responses.

2. **P1 — OTP creation has a concurrency race.** `src/lib/admin-otp.ts:44` deletes globally expired challenge rows. Line 47 inserts an epoch-expired placeholder before the separate activation update on line 51. Another concurrent starter can delete this placeholder, causing a fresh request to be rejected as a cooldown. Evidence: the full 231-test run had one initial-OTP failure (230 passed); that same integration test passed alone. The interleaving is evident in the source, although a deterministic interleaving regression test has not yet been written. Make initial challenge creation/claim safe from concurrent cleanup and add that regression test before signing off authentication reliability.

3. **P1 deployment gate — OrangeHost runtime and recovery remain unverified.** The local readiness check exits nonzero because HOSTING_PUBLIC_ROOT is not configured. BACKUP_DIRECTORY and BACKUP_ENCRYPTION_PASSWORD are absent in the current environment. The backup tooling was tested with fixture SQL and photo bytes, not a full real-database disaster-recovery exercise. Verify actual cPanel Node version/startup compatibility, private storage paths, HTTPS, account quota, off-host backups, retained EMAIL_SETTINGS_KEY and an isolated full restore on the target setup. The available local runtime bundle was built on macOS and must not be uploaded as a Linux release; rebuild on compatible Linux.

4. **P1 operations gate — Durable email retries are not scheduled.** NOTIFICATION_CRON_SECRET is absent and POST /api/jobs/notifications returns 503. Initial processing may run on submission, but pending jobs after failure/restart need the scheduler. Configure the protected endpoint and host-supported scheduled POST, then test recovery from a controlled failed notification. Gmail credentials are saved; this audit did not send an actual OTP or email and cannot certify inbox delivery.

5. **P2 — Image storage can exhaust a small hosting account.** `src/app/api/admin/upload/route.ts:8` parses the multipart body before checking the extracted file's 10 MB limit. Magic-byte checks do not decode/limit pixel dimensions or compress originals. Product deletion (`src/app/api/admin/products/[id]/route.ts:111`) removes records, not original files. Use host request-size limits plus bounded upload handling, decoded dimension limits, image optimisation and reference-aware unused-file cleanup. Do not delete shared CMS/product photos merely because one product reference disappears.

6. **P2 — Shop notification recipient is hardcoded.** `src/lib/notifications.ts:5` sends business notifications to emanagold6590@gmail.com, whereas configured authentication uses a different admin mailbox. This is not proof the business recipient is wrong, but Email Settings does not change it. Confirm the intended recipient and make it an explicit managed setting or environment value before live customer enquiries; avoid assuming a successful OTP test also verifies shop notifications.

7. **P2 — CI does not run on the current branch's pushes.** `.github/workflows/ci.yml:5` accepts pushes to main and pull requests targeting main only. Current work is on codex/mysql-migration. Local checks exist, but a push here alone does not supply a Linux CI gate. Open a PR or broaden the intended workflow triggers and require a passing check. The verification documentation also still describes PostgreSQL in one introductory paragraph while CI now uses MySQL.

## Verified evidence

- Local production smoke script passed its sampled storefront, service, product, sitemap, metadata, structured-data and media checks: 28 sitemap URLs, four sampled uploaded images returned HTTP 200. Its empty launch_blockers list only covers that script's assertions, not this entire audit.
- Anonymous GET /admin redirected (307). Anonymous product creation, uploads and private CMS reads returned 401.
- Production dependency audit: zero known reported vulnerabilities at audit time. Development dependencies were not included in that result.
- ESLint and standalone TypeScript check passed for the audited release.
- The latest unchanged production build passed when adding the footer credit, and the running build was checked during this audit. No redundant rebuild was run during this read-only assessment.
- MySQL integration tests and unit/component tests: full run 230 passed, 1 failed (OTP creation); isolated rerun of the failed test passed. This is an unresolved reliability finding, not a clean full-suite result.
- Local preflight found zero missing uploaded product image references and saved email credentials.

## Limits and release acceptance

No real customer enquiries, WhatsApp messages or emails were sent. No production records were altered; automated database tests use disposable fixtures. No new mobile viewport/browser acceptance, Lighthouse/Core Web Vitals or real network load test was performed in this audit. Local timings are not OrangeHost/mobile performance results.

Before launch: resolve findings 1–2; complete hosting, backups and notification acceptance; verify the notification recipient; then pass a fresh full test/CI run and an end-to-end staging check covering admin OTP, adding a product/photo, enquiry persistence, notification delivery and restart/redeploy image persistence. Existing data, gallery, SEO and authentication foundations can be retained while these issues are addressed.

## Follow-up implementation — 8 November 2026

Code changes now remove static inventory/collection fallbacks from public APIs, product and collection pages, the sitemap and admin product forms. Empty inventory remains empty; database outages return explicit unavailable responses. A fixture-based test ensures deleted demo products cannot receive product metadata even if static fixtures are reintroduced later.

OTP placeholders now receive a short future expiry, so concurrent expired-row cleanup cannot delete them between insertion and activation. The integration test deterministically runs cleanup at that exact point and verifies code creation succeeds. Existing expiry, attempts, purpose separation and single-use checks remain in place.

Uploads now bound the request body before multipart parsing, decode still images with a 25-megapixel limit, resize inside 2048×2048 and produce metadata-stripped WebP. Processing is limited to one upload per process and authenticated uploads are rate-limited. Existing photos are not rewritten. The reference-aware cleanup command reports by default; deletion requires maintenance and backup acknowledgements and retains CMS revisions, recent uploads, symlinks and unknown filenames. A real-MySQL fixture test verified that only an old unreferenced temporary photo is deleted, while a revision-linked photo and recent upload remain.

Shop notification recipients now use SHOP_NOTIFICATION_EMAIL, defaulting to ADMIN_EMAIL, and links use the configured public origin. CI runs on codex/** branch pushes as well as main. The HTTPS notification scheduler command and explicit readiness failures for missing scheduler/backup configuration are added; no host cron was provisioned and no business emails were sent during verification.

Verification after source changes: full suite 239 passed; an additional cleanup integration test passed; lint/type checks and production build passed; production storefront smoke checks passed. The scheduler test uses a mocked HTTPS transport and image cleanup uses disposable temporary files. The report-only scan of existing storage found one candidate and deleted no existing business images. OrangeHost runtime/path verification, enabling scheduled jobs, off-host backup setup, a full target-host restore drill and actual inbox/mobile acceptance remain open release gates. No live-host readiness claim is made.
