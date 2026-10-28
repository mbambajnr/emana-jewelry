# MySQL migration

The `codex/mysql-migration` branch replaces PostgreSQL with MySQL while preserving the storefront and admin APIs. Do not run the MySQL migration history against an existing PostgreSQL database. The original schema and all twelve PostgreSQL migrations remain in `prisma/postgresql/`; Git also retains the working PostgreSQL release.

## Changes

- MySQL Prisma provider with the MariaDB driver adapter (the adapter supports MySQL).
- Gold/Silver choices remain arrays in the API and forms, stored as a MySQL JSON array. Catalogue filters use JSON membership.
- Search uses the baseline's `utf8mb4_unicode_ci` collation for case-insensitive text matching. Product/category slugs and SKUs are also case-insensitive under this collation; conflicting source values cause the copy to fail and roll back, rather than overwrite data.
- Longer descriptions, notes (including 2,000-character staff activity notes), care instructions, and URLs have explicit text types. Email and staff actor fields support 254 characters. Product names support 300 characters and image descriptions 500. Four-byte Unicode preserves Ghanaian names, symbols, and emoji.
- The connection pool defaults to three connections and each session uses UTC. Credentials are URL-decoded. Use `?sslaccept=strict` for verified database TLS when connecting remotely.
- A fresh MySQL baseline and a field-length migration replace PostgreSQL-specific SQL. Existing databases require a data transfer, not just a changed connection URL.
- Homepage products and collections explicitly wait for a request before using the MySQL driver. This follows Next.js 16's rendering rules for drivers that read the current time internally.
- CI runs against MySQL 8.4 and includes an opt-in real-database integration test.

## Local verification

A separate `emana-jewelry-mysql` container runs MySQL 8.4 on port 3307 with the persistent Docker volume `emana-jewelry-mysql-data`. PostgreSQL remains running separately and has not been modified. Credentials are held only in ignored local environment files. A PostgreSQL dump is saved in `.data/postgres-before-mysql.sql` with owner-only permissions; do not commit or share it.

The copy transferred one category, twelve products, thirty-four image references, and three historical click records. Every field, ID, timestamp, and JSON value was compared before the MySQL transaction committed. The other business tables were empty. A second verification confirmed an exact match. A repeated copy into the populated target was rejected.

Final verification: 173 tests passed across 48 files, including the real MySQL integration test; lint, TypeScript, and the production build passed.

The real MySQL test creates temporary products, long text, Unicode, CMS content, a quote, a consultation, and analytics events inside a transaction. It checks search, metal filters, JSON reads, stale-version guards, and grouping, then rolls everything back. No verification customers or orders remain in the shop.

## Fresh installation / OrangeHost preparation

1. Confirm the actual MySQL/MariaDB and Node.js versions in the hosting account. Node.js 20 must be at least 20.19; an unspecified “Node 20” option is not sufficient confirmation. Local verification uses MySQL 8.4. The MySQL change does not confirm that Micro's Node application runner or memory limit supports this Next.js deployment.
2. Create an empty, dedicated database and database user in cPanel. Use the full cPanel-prefixed database and user names and the host/port supplied by OrangeHost.
3. Set `DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE` in the application's private environment. Percent-encode special characters in credentials. Keep admin and session settings unchanged.
4. Install dependencies for the hosting platform, then run `npx prisma generate` and `npx prisma migrate deploy`. No shadow database is needed for `migrate deploy`.
5. Transfer and verify source data using the tool below. Keep both apps from accepting changes until verification and cutover finish.
6. Build and start the app; verify the storefront, staff login, CMS, enquiries, and reporting. Keep the source database and backup until the new deployment is confirmed.

Do not paste credentials into chat, Git, command arguments, or screenshots. Do not use the destructive seed script to transfer shop records.

The MySQL production smoke check passed for six public pages, canonical URLs, JSON-LD, sitemap (20 URLs), robots rules, and protected analytics. The same pre-existing production photo-storage blocker remains; database compatibility does not resolve it. The live development browser also confirmed uppercase `DOLLAR` search with the Silver filter returns the correct product.

## Copy tool

Provide `SOURCE_DATABASE_URL` (PostgreSQL) and `TARGET_DATABASE_URL` (MySQL) through private environment variables or an ignored environment file loaded by your shell. The normal app uses `DATABASE_URL`; the copy tool deliberately requires separate source and target names.

```sh
node scripts/migrate-postgres-to-mysql.mjs          # read-only preflight; requires empty target
node scripts/migrate-postgres-to-mysql.mjs --copy   # empty target only; verify every field before commit
node scripts/migrate-postgres-to-mysql.mjs --verify # compare without writing either database
```

The tool reads a consistent, read-only PostgreSQL snapshot. Target inserts run in one transaction, preserving IDs, relations, JSON, and timestamps. Errors roll back the target transaction. It prints table counts rather than customer records or connection strings. For a large future database, replace this in-memory transfer with a reviewed streaming migration.

## Checks

```sh
npm run lint
npm run typecheck
npm test -- --maxWorkers=1
RUN_MYSQL_INTEGRATION=1 node --env-file=.env node_modules/vitest/vitest.mjs run tests/mysql.integration.test.ts --maxWorkers=1
npm run build
```

The real-database test is skipped unless explicitly enabled. Set `DATABASE_URL` to a MySQL test database with the baseline applied before enabling it.

## Rollback

Before cutover, switching back is straightforward: stop the MySQL app, check out the PostgreSQL release (`2ae3082`), restore the original PostgreSQL connection, install that release's dependencies, regenerate its Prisma client, and restart. Do not apply MySQL migrations to PostgreSQL. New requests or edits made after cutover would need a separate reverse data transfer; switching old code back alone would lose those changes from view.

## Separate storage work

This migration does not move image files. The copied image references still use the existing local upload paths. Permanent photo storage and the production image runtime must be configured before public deployment. OrangeHost storage integration remains separate from database compatibility.
