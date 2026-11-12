# OrangeHost deployment and data operations

This is a Node application with MySQL and private filesystem image storage. It is not a static site or PHP application. The hosting account has not been connected or deployed by these changes.

OrangeHost's published Micro specification lists 5 GB storage, 1 GB RAM, one shared CPU, MySQL and Node.js through version 20, with three days of host backup retention: https://v2.orangehost.com/web-hosting. Confirm the actual account in cPanel: Node **20.19+**, **22.12+** or **24+** is required by this repository's dependency set. Prefer a supported 22/24 runtime if the host provides one. Do not downgrade dependencies to fit an older runtime without a separate compatibility review.

## Private directory layout

```text
/home/ACCOUNT/
  emana-app/           deployed runtime; never public_html
  emana-ops/           private repository checkout for migrations and operator scripts
  emana-media/         original uploaded photos; retain across every release
  emana-backups/       encrypted snapshots; also copy off-host
  emana-secrets/       protected environment files if not managed by cPanel
  public_html/        hosting document root; no secrets, backups or uploaded originals here
```

Own private directories as the Node account; use 0700 directories and 0600 secret/backup files. The Node process needs write access to media and its `.next` cache. The media route serves originals through the app. Database rows store `/media/products/...` addresses, not physical paths; moving the private image directory does not change these URLs.

Configure the application's production environment in cPanel or a protected file loaded by the process manager. Do not put credentials in the startup command, a public directory or Git. Required settings are in `.env.example`:

- `DATABASE_URL`: cPanel-prefixed database/user, URL-encoded password, localhost and `?connection_limit=3`. Start with one app worker; each worker has its own connection pool. Apply migrations using this same database.
- `PRODUCT_IMAGE_DIRECTORY=/home/ACCOUNT/emana-media`, `IMAGE_STORAGE=filesystem`.
- `HOSTING_PUBLIC_ROOT=/home/ACCOUNT/public_html`, `BACKUP_DIRECTORY=/home/ACCOUNT/emana-backups`.
- `NEXT_PUBLIC_SITE_URL=https://YOUR_REAL_DOMAIN` **before building**; public variables are embedded at build time.
- Preserve `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` and especially `EMAIL_SETTINGS_KEY` across releases. An intentional bootstrap hash change resets the active security password. Losing the email encryption key makes saved Gmail passwords unreadable.
- Use a distinct random `BACKUP_ENCRYPTION_PASSWORD` (32+ characters). Store it and the server environment in protected off-host escrow; encrypted database backups alone cannot restore email settings without the original encryption key.

## Build and deploy

Micro has limited RAM and disk: build on a compatible Linux CI runner or Linux machine, rather than the live account. A macOS `.next` or `node_modules` upload is not a Linux release. Keep only the active runtime and one rollback release if the quota permits; do not accumulate caches, build directories and archives. Monitor the account's total quota, which may include mail and databases.

On the build runner, install the locked dependencies and generate Prisma, then:

```sh
npm ci
npx prisma generate
ORANGEHOST_STANDALONE=1 npm run build
npm run hosting:package
```

The package command stages the small runtime tree, public files and static chunks under ignored `build/orangehost`, filtering environment files. It refuses to overwrite an existing artifact. Supply the production public origin and build requirements through the runner's secret environment; never publish `.env` or generated artifacts to Git. The runtime folder alone is not an operations checkout and does not include migration/backup tooling.

In cPanel, register a production Node application whose private application root contains this package and whose startup file is `server.js`. Confirm that OrangeHost's process manager supports the generated Next server and that it forwards HTTPS requests correctly. Use the port supplied by the process manager. If the account only accepts a different Passenger startup model, validate it with OrangeHost before cutover; this repository does not assume that creating a Node entry proves compatibility. For an account supporting command-based process management, use the generated `server.js` or a normal checkout's `npm start`. Never run `next dev` in production.

From the separate private operations checkout, with the intended production environment loaded:

```sh
npm ci
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm run hosting:check
```

Back up first. Stop writes for incompatible migrations. Do not use `prisma db push`, reset, or seed against live business data. Never automatically seed sample products on startup. Swap in the new runtime, restart the registered app and verify it before deleting the old runtime. Code rollback alone does not reverse a schema migration; keep migrations backward-compatible or restore a matched database/code pair.

`hosting:check` is read-only. It checks the Node version, essential environment, private image directory, accessible uploaded product images, connection/schema state and presence of email credentials. It exits nonzero for blockers without printing secrets. It does not prove inbox delivery, complete migration status, account quota or restore capability; those require their own checks. Set `HOSTING_PUBLIC_ROOT` to the actual account path, not the example placeholder.

## Encrypted database and media snapshots

Prerequisites: `mysqldump` (or a compatible `mariadb-dump` selected with `MYSQLDUMP_BIN`), `tar`, and `openssl`. The backup script supports the local MySQL server used by shared hosting; it rejects remote database URLs. No password is passed as a command-line argument. A temporary private client configuration is removed after completion. Archives use AES-256-CBC with a salted PBKDF2 key (200,000 iterations); keep them on trusted storage and verify restores. Encryption is not a substitute for access controls or tamper-proof storage.

1. Stop the Node app in cPanel and any other writers/notification jobs. This is necessary to keep image files and their database references consistent. Do not schedule the flag below while the app is still writing.
2. Run from the private operations checkout, with production environment loaded:

```sh
npm run hosting:backup -- --maintenance-confirmed
```

3. Restart the app, confirm health, and copy the encrypted archive off-host. The script never deletes older backups automatically. Check available quota before each run: staging temporarily requires space for uncompressed SQL as well as the encrypted archive.
4. Keep a deliberate retention policy, for example seven daily and four weekly off-host copies, adjusting local retention to the 5 GB quota. Native host backups are an additional layer, not the only recovery path. A maintenance-window schedule must stop/restart the app through the host's supported process manager; do not guess the cPanel service command.

An archive contains `database.sql`, `manifest.json`, and the image directory under its original basename. It deliberately excludes the environment and encryption keys. A failed backup removes its partial archive and private staging directory; existing snapshots are retained. A killed process/power loss can leave a private `.staging-*` directory; inspect and remove that leftover only after confirming no backup is running.

## Restore drill (isolated environment first)

1. Retrieve the matching code release, encrypted archive, backup password and protected environment keys. Verify the archive's trusted source before extraction. Use an isolated private directory and test database.
2. With `BACKUP_ENCRYPTION_PASSWORD` in the shell environment, decrypt without exposing it in process arguments:

```sh
umask 077
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_PASSWORD -in SNAPSHOT.tar.gz.enc -out snapshot.tar.gz
tar -tzf snapshot.tar.gz
```

3. Extract only a trusted archive into the isolated directory. Import `database.sql` into the empty test database using a protected MySQL option file (not a command-line password). Point a matching test release at that database and the restored media directory; retain the original `EMAIL_SETTINGS_KEY`. Keep actual email/notification jobs disabled during the drill.
4. Check product counts, representative image files/URLs, CMS content, enquiries and login configuration. Only call a backup usable after this passes. Delete decrypted scratch files securely according to the storage platform's policy.
5. A live restore requires a maintenance window and a backup of the current state first. Stop all writers, restore the matching database and media together, restart, check, then reopen traffic. Do not import a backup over the live database as a test.

## Before opening the shop

Verify HTTPS, product detail/catalog pages, real upload and image display after restart/redeploy, admin email test and OTP, enquiry persistence, backup/restore, and a scheduled notification runner. Configure `NOTIFICATION_CRON_SECRET` and the host-supported HTTPS POST scheduler described in `PRODUCTION-HARDENING.md`; never put its token in a URL. Only set `TRUSTED_CLIENT_IP_HEADER` after the host confirms it overwrites that header. Confirm limits on request bodies, image optimisation memory, cron frequency and concurrent Node processes with OrangeHost.

The preflight checks filesystem free blocks, not a cPanel account quota. Keep an eye on both. Image compression, pixel-dimension limits, unused-file cleanup and measured load testing remain separate improvements; a deployment structure does not provide those automatically.

## Notification jobs and image housekeeping

Set `SHOP_NOTIFICATION_EMAIL` to the business inbox; if blank, notifications go to `ADMIN_EMAIL`. Sender settings do not change the recipient. This replaces the previous hardcoded shop inbox. Confirm both inboxes deliberately before launch.

Set a separate `NOTIFICATION_CRON_SECRET` on the runtime and in the private scheduler environment. The host scheduler can run `node --env-file=/home/ACCOUNT/emana-secrets/production.env /home/ACCOUNT/emana-ops/scripts/hosting/run-notifications.mjs` at the interval supported by the account. This command uses HTTPS POST, rejects redirects, limits request duration, never prints the token, and exits nonzero for HTTP failures or failed deliveries. Prevent overlapping scheduler runs using the host-supported lock mechanism. Merely adding the command does not configure cPanel cron; verify actual runs and a controlled retry after restart.

New photos are decoded, restricted to 25 megapixels, resized within 2048×2048, stripped of metadata and converted to WebP. Upload request bodies are bounded to 11 MB before multipart parsing; each file remains limited to 10 MB. One image transformation runs at a time per process. Existing originals are retained. Also set the reverse proxy request body limit to 11 MB and start with one Node worker on Micro.

Use `npm run hosting:images` for a report-only scan of originals older than seven days. It checks product images, category images, published/draft CMS content and retained revisions, preserving files referenced by any of them. Unknown filenames and symlinks are retained. Do not delete photos automatically when deleting a product; CMS content may still reference them.

After verifying a database-plus-files backup and stopping all writers, `npm run hosting:images -- --delete --maintenance-confirmed --backup-confirmed` removes only the old, unreferenced candidates. Do not run this delete mode while staff are editing or uploading. No image files were deleted as part of implementing these tools.

## Deployment handoff for emanajewelries.com

The CI workflow now targets Ubuntu 22.04 x64 and Node 20.20.2 (the runtime shown in the account screenshot), builds for `https://emanajewelries.com`, then packages the tested standalone runtime as a tar archive with a SHA-256 checksum. On a successful branch push, download the `emana-orangehost-COMMIT` artifact from GitHub Actions. Verify its checksum and extract the tar archive into the private application root. The tar preserves `.next` and file permissions; do not upload only the visible files from an extracted folder. Pull request runs test/package but do not publish an artifact. A manual dispatch option is available after the workflow is available to GitHub.

This is a build pipeline, not an automatic deployment. A successful remote workflow run and a matching host architecture/OS remain required. Do not deploy the older locally generated Mac artifact. Supply the real database, keys and SMTP settings at runtime, not as CI build secrets. No business database, photos or live credentials are included in the runtime artifact.

Account checklist before transferring data:

- cPanel application: Node 20.20.2, Production, private `emana-app` root, `emanajewelries.com` at `/`, startup file `server.js`. Confirm actual home path and Passenger compatibility.
- Create the cPanel MySQL database/user and grant access only to this app database. Preserve the source database; do not seed/reset live data.
- Create separate private media, backup and secrets directories. Move the current original photos with byte verification; retain their public URLs.
- Admin and shop recipient: `emanajewelries@gmail.com`. SMTP remains authenticated as `welsa250@gmail.com` by user preference; preserve its encrypted password plus EMAIL_SETTINGS_KEY, or configure that same account with its own App Password on the target. Public contact and reply address remain official.
- Configure the notification scheduler, backup password and off-host retention. Then complete a full restore drill using an isolated database before calling recovery ready.
- Verify HTTPS and both domain variants, canonical origin, admin OTP, product upload/edit, image persistence across restart, quote/consultation storage and delivery, sitemap and mobile browsing. Keep DNS changes until the target is validated through the host's supported preview mechanism.

CI runs development checks on Node 24 because jsdom 30/its HTTP test dependencies require a newer Node than the production server. It then switches to Node 20.20.2 for the production build and runtime packaging. Test-only dependencies are not part of the standalone runtime. Use Node 24 locally for npm test; the Node 20 compatibility check is the production build, package startup and host acceptance.

## Confirmed server104 compatibility adaptation

The actual account is x86_64 with glibc 2.17. OrangeHost confirmed its shared servers cannot provide newer glibc. The earlier Sharp-based release must not be deployed there.

Production now avoids native Sharp: `images.unoptimized` serves existing image files directly; browser-side upload preparation converts browser-readable JPG/PNG/WebP/AVIF files into bounded JPEG/PNG, preserving transparency. Server-side Jimp and image-size validate/decode/re-encode images with the existing byte, dimension, authentication and concurrency limits. Browsers that cannot decode an input format give a JPG/PNG retry message. Animated inputs are not supported. Existing WebP/AVIF originals remain readable by customers' browsers and their URLs are unchanged.

Sharp is retained only as development tooling to generate/inspect test fixtures. The packager excludes Sharp and its platform libraries, and verifies their absence. CI smoke-tests the actual packaged server on Node 20: startup, homepage, an original image served byte-for-byte, and protected upload endpoint imports. This is additional evidence, not a substitute for Passenger acceptance on server104.

Runtime image optimisation is deliberately disabled: the host no longer generates responsive image variants on demand. Newly uploaded photos are resized within 2048 pixels; pre-existing large originals should be reviewed for mobile transfer size. Do not rewrite or delete originals automatically during deployment. No external image service or subscription is introduced.
