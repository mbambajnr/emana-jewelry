# Search and AI discovery

The app supplies page-specific search/share metadata, canonical URLs, a public XML sitemap, JewelryStore business data, and a visible business introduction and local FAQ answers. Private admin pages, cart, and wishlist have noindex metadata. Public content remains crawlable under the general robots.txt rule, including search crawlers used by AI services.

Before launch:

- Set NEXT_PUBLIC_SITE_URL to the real HTTPS domain before building. The current fallback is https://emanajewelry.com; confirm ownership and the chosen hostname.
- Confirm the address, opening hours, contact details, and every certification/sourcing claim with the business. Keep these details consistent with the Google Business Profile.
- Publish real product descriptions and images. Prices are quoted individually, so Product markup does not claim a fixed purchasable offer price.
- Verify the production domain in Google Search Console and Bing Webmaster Tools, then submit /sitemap.xml. Inspect the homepage and one live product/collection URL after deployment.
- Validate live structured data with Google's Rich Results Test and Schema.org Validator. Product markup without an offer or eligible reviews may not qualify for product rich results; accurate information takes priority.
- Check crawler access at the hosting/CDN layer, HTTPS, redirects, and production status codes. robots.txt is not access control.
- Measure actual search impressions, visits, and completed inquiries. Code changes alone do not guarantee rankings or AI citations.

No special AI text file or schema is required for Google's AI search features. Clear, useful, crawlable business information is the foundation. Do not add invented reviews, certificates, addresses, service areas, or social profiles for search visibility.

## Admin verification settings

Open **Admin → Search & SEO**. Paste Google's `google-site-verification` tag and Bing's `msvalidate.01` tag (or just their content values), save, and finish verification in each provider. Google HTML tags require a URL-prefix property; Domain properties require DNS verification.

For production, run `npx prisma generate` during installation/build and `npx prisma migrate deploy` against the deployment database before enabling settings. The new SearchSettings table persists verification codes. Saved codes are cached for metadata rendering and invalidated immediately after a save. Google/Bing account verification and sitemap submission remain provider-side steps; this does not provide OAuth reporting integration.

Development uses `.data/search-settings.json`, ignored by Git. These local values are not deployed or copied to the production database automatically. A database failure is shown as a save/load error in admin; the public website continues rendering without verification tags if settings cannot be read. Do not remove saved tokens after verification because providers periodically recheck ownership.

## Social profiles

Open **Admin → Social Media** to update Instagram, Facebook, and TikTok profile URLs. Use full HTTPS URLs from the matching platform. Blank fields leave icons inactive. Footer icons load the current saved links; saving expires the server-side settings cache, and a page refresh picks up changes without a rebuild.

Production requires the SocialSettings database migration (`npx prisma migrate deploy`) and generated Prisma client. Development persists to the ignored `.data/social-links.json` file. Local values are not copied to production automatically. Missing database access produces an admin error instead of a false successful save.
