# Storefront quality checks

Checked on 28 October 2026 using the local production build and PostgreSQL database.

## Verification

- Full suite: 166 tests passed across 44 files. Four additional reporting/CMS schema tests passed; the three report tests were rerun after the rendering adjustment.
- ESLint, TypeScript, and the production build passed.
- Canonicals, one H1 per sampled page, valid JSON-LD, sitemap XML (20 URLs), robots.txt, filtered catalogue noindex, cart/wishlist noindex, admin analytics sign-in, and immutable hero-image caching passed HTTP checks.
- Existing tests cover mobile swipes, gallery changes, video deferral, Gold/Silver enquiries, search, filtering, pagination, quote validation, and CMS publishing. This is not a claim of a physical-device/network audit.
- Product views and WhatsApp clicks have validation, same-origin checks, browser privacy-signal tests, and duplicate-view suppression tests. Report queries require admin authentication and show an error on database failures.

## Local production response baseline

These are median times to the first response byte over three warmed requests, measured from the same computer. They exclude image transfers, JavaScript execution, hydration, and external-network latency. They are not full page-load times, Core Web Vitals, or Lighthouse scores.

| Page | Warm response | HTML bytes |
| --- | ---: | ---: |
| `/` | 4.8 ms | 109,194 |
| `/catalog` | 4.5 ms | 100,029 |
| `/catalog?metal=Silver&sort=name` | 4.8 ms | 101,515 |
| `/products/versace-lion?metal=Silver` | 6.8 ms | 77,844 |
| `/faq` | 9.9 ms | 61,717 |
| `/privacy` | 8.1 ms | 47,384 |

## Launch blocker: product photos

The HTML/SEO checks pass, but the production photo check fails. Current sample product images use `/media/products/…`, which deliberately serves local uploads only during development. The local environment also lacks a working native Sharp runtime for production image transformations. Keep the app in development for the current local catalogue. Before hosting, upload the existing photos to the configured permanent storage, update their product URLs, and install production image dependencies on the deployment platform. Repeat the audit until all sample image requests succeed. Do not deploy the current local photo paths expecting them to work.

No product photos or product records were moved or changed by this audit. No WhatsApp messages were sent. A physical mobile/network test and deployed-site Web Vitals measurement remain unverified.

## Repeat the checks

```sh
npm test -- --maxWorkers=1
npm run lint
npm run typecheck
npm run build
npm run start -- -p 3001
# In a second terminal:
python3 scripts/check-storefront.py --base-url http://localhost:3001
```

The smoke check reads public pages without submitting enquiries. It exits nonzero if the sampled product photos fail. JSON results from this run are in `docs/quality-audit-2026-10-28.json`.

## Activity reporting

Open **Admin → Analytics** for a rolling 30-day view and enquiry report. New view counts start with this update; older WhatsApp clicks without a product slug remain in the all-time report. Counts are event totals, not unique customers or confirmed conversations. Optional browser tracking respects Do Not Track and Global Privacy Control. Views are counted at most once per product per tab every 30 minutes. Blocked storage suppresses view tracking. Records contain public product references, page paths, metal choices, and timestamps, without visitor identifiers or enquiry-message content. Same-origin validation does not make public event counts fraud-proof.

Apply migration `20261028180000_product_activity` and regenerate the Prisma client before starting this version on another environment. The local database is already migrated.
