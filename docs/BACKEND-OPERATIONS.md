# Backend operations

The admin is organised into Overview, Catalog, Client Care, Reports, and Settings. Inquiry stages are new → contacted → quoted → accepted → completed, plus cancelled. Appointments start as requested and can be confirmed, completed, or cancelled. Staff may correct a stage; every saved stage change or note records the previous stage, actor, and timestamp. Updates use the expected previous status so a stale tab cannot silently overwrite a newer stage.

## Data and access

Private server-rendered records check the configured admin session at retrieval. Admin mutations check both the session and request origin. Consultation lists are private. Public category lists remain public; category creation requires admin access. Customer item names come from the server catalog. All new inquiries are unpriced: legacy numeric price/total fields stay zero internally and are never presented as a free offer or quotation. Clients request a price directly from the owner. Product creation does not require a selling price; public product responses do not expose legacy catalog prices. Invalid quantities, unknown products, malformed contact details, and invalid appointment dates are rejected.

A submission succeeds only after a database write. Database failure returns an error; no synthetic inquiry reference or appointment confirmation is issued. Appointments require staff confirmation. Notification delivery runs through Next.js `after()` once the request is saved; failed email delivery does not undo the saved request. Email delivery is best-effort at this stage, not a durable queue with retries. Customer-facing messages do not promise that an email was delivered.

## Local database / deployment

The configured PostgreSQL database must be running and reachable. Local verification uses the project database; CI provisions a separate temporary PostgreSQL service. Never point CI or sample-data scripts at the live shop database.

1. Start PostgreSQL or the intended Docker database and confirm DATABASE_URL points to it.
2. Run `npx prisma migrate deploy` and `npx prisma generate`.
3. Check `/admin`: unavailable data is shown as a connection error rather than fabricated zero counts.
4. Test an actual inquiry and appointment using controlled test contacts, then exercise the stages and inspect the activity history.

Migrations cover settings, product media, social profiles, and request activity. Apply all committed migrations to each new deployment. Existing pending inquiries become new; existing confirmed appointments are preserved. New appointments default to requested. Development-only social/search settings currently remain in ignored local files; production uses database tables. They must be entered in the live admin after deployment.

Production builds use Webpack, matching the development script, because the native SWC/Turbopack binding is unavailable on this machine. This avoids changing platform security settings.

## Further launch work

Configure and test backups, a durable email outbox with retries, shared rate limits for login and public submissions, monitoring, and the real deployment's database/hosting credentials. Staff roles and separate accounts are future work; the current admin is one configured account. Search ownership verification still happens in Google/Bing accounts.
