# Architecture and decisions

## Inquiry commerce

The owner quotes prices directly. The catalog therefore presents products and contact actions rather than a payment checkout. Legacy numeric price fields remain in the schema for compatibility, but public catalog payloads and new quote requests use zero internally and do not display that as a selling price. Request handlers resolve submitted product identifiers against the catalog rather than trusting client-provided names or totals.

## Rendering and data

Next.js App Router handles the storefront and admin in one application. Server-rendered components read MySQL through Prisma; client components handle galleries, forms, menus, and browser storage. Suspense boundaries allow database-backed sections to load independently. Prisma relations hold product galleries, materials, stones, and collection membership.

The full catalog uses URL parameters for category, search, and page so a filtered view can be linked or restored. Recently viewed items and favorites stay on the visitor's browser. Catalog scroll restoration uses session storage for the current tab. This avoids customer accounts but does not provide cross-device synchronization.

## Staff access and requests

Admin access uses a signed session cookie and one environment-configured email/password hash. Private data reads check the session; admin mutations also validate the request origin. This is suitable for the current single-owner workflow but is not a staff identity or permissions system.

Inquiries and appointments are saved before success is returned. Stage changes record activity and compare the expected previous status to avoid silently overwriting a newer update. Notification emails run after persistence. Email jobs are saved in the same transaction as the request. Failures remain in a durable outbox with backoff, worker leases, and staff-visible retries. The protected runner must be scheduled in production.

## Media and external services

Development images are stored on disk in an ignored directory. Production uploads use a configured filesystem directory outside the app checkout; an explicitly selected Supabase bucket is also supported. The public media route serves the persistent filesystem in production. The image migration copies files without changing URLs. YouTube embeds are deferred until a visitor chooses to play a video. WhatsApp opens a product-specific enquiry for the visitor to send.

Remotion supplies the animated hero, not a video rendering backend. Removing it later would be a storefront presentation change, not a database migration.

## Boundaries and next steps

The app keeps a single deployable service rather than splitting the admin, API, and storefront into independent services. At this scale that simplifies shared validation, deployment, and maintenance. The tradeoff is a shared release and failure boundary.

Before a public launch, verify production storage and email, establish backup/restore procedures, configure the trusted proxy identity header, notification runner, and monitoring, and review the existing sample-data fallback behavior. Multi-user staff roles and durable notifications should follow actual operating needs.
