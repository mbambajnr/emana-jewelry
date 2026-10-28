# Verification

## Automated checks

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. GitHub Actions repeats those checks with PostgreSQL and applies migrations to a fresh temporary database. Tests cover request validation and stage changes, authentication boundaries through route mocks, catalog navigation, media validation, quote lists, product galleries, recent history, and selected admin forms. They do not replace a browser acceptance pass or production integration tests.

## Browser acceptance pass

Use a local/staging database and controlled test contacts. Do not submit test requests to real customers or open/send external messages merely to check a link.

- At phone and desktop widths, check navigation, readable headings, content margins, and absence of horizontal scrolling.
- Search the catalog, select a category, change pages, and open a product. Verify the product URL resolves and Back to browsing restores the view.
- Check gallery thumbnails, mobile image swipes, image enlargement, and a configured video. Inspect the WhatsApp destination and message without sending it.
- Save/remove favorites and quote items. Confirm no selling price or free-price claim is shown.
- Open the custom-order form through the navigation, validate required fields, and submit only in a controlled environment. Confirm the saved request is visible to staff.
- Sign in as admin, add/edit a test product with multiple photos, reorder them, and verify the resulting storefront. Check that unauthenticated visitors cannot mutate admin data.
- Verify inquiry/appointment stage changes and stale-update handling, then remove only the disposable test records you created.

## Deployment acceptance

Test real image uploads against the configured Supabase bucket, sender verification and email delivery, canonical URLs and sitemap, and database backup/restore. A successful local build does not establish any of those production connections.

## Cleanup verification — 25 October 2026

- All 103 existing tests passed. A separate new navigation test passed for menu focus trapping, Escape, and focus restoration.
- ESLint, TypeScript, and the Webpack production build passed locally.
- The built app returned 200 for the homepage, full catalog, catalog search, and a database-backed product detail page. The removed homepage collection heading stayed absent and the extracted services section remained present.
- `/admin/products` redirected an unauthenticated request to login. Product creation and upload endpoints returned 401 without a session.
- Browser checks exercised catalog search, opening a product, changing its photo, and mobile navigation to the custom-order form. The catalog had no horizontal overflow at 1280 px and 390 px.
- No real customer submissions, outgoing WhatsApp messages, production uploads, or email deliveries were made during this pass. Those integrations still require deployment acceptance.

## CMS verification — 28 October 2026

- The full suite passed 139 tests. The new-service panel also passed a focused regression check after fixing its tendency to close while typing a description.
- Lint, TypeScript, and the production build passed.
- Acceptance checks used a separate temporary PostgreSQL database and a local production server. They verified protected draft reads, draft-only service rejection, private draft preview, publication, new-service bookings, readable appointment snapshots, stale-write rejection, baseline revision capture, restore-without-publication, and publishing a restored baseline.
- Browser checks exercised adding a service, editing its description and duration, saving a draft, and publishing. The newly published service appeared in both homepage cards and the appointment dropdown. A final regression check confirmed that editing one service's duration left existing services unchanged.
- The content editor was checked at 1280 px and 390 px. At phone width the fields stayed inside the viewport without horizontal overflow.
- The temporary test database and test account configuration were removed afterward. The shop's content and customer records were not used for test submissions. Outgoing email was disabled in the acceptance environment.
