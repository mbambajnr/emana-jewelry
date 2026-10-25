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
