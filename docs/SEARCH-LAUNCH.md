# Search launch checklist

## Website changes

- `/services` links to every enabled published CMS service. Each service has a stable `/services/{id}` address, canonical metadata, descriptive content, Service and BreadcrumbList structured data, and direct enquiry links. Published enabled services are included in the sitemap. Disabled and unknown services render a not-found page with noindex.
- Edit descriptions and **Service page details** in Admin → Website Content → Services, then save and publish. New enabled services receive pages automatically. Existing documents work without a database migration.
- Homepage service headings and the footer link to these pages. Custom Jewelry navigation still goes to the existing form.
- Official social links saved under Admin → Social Media become homepage `sameAs` business references. Empty values are omitted; no profiles are invented.
- Saturday hours now match the owner's confirmation: Monday–Saturday, 9am–6pm. The location card no longer claims the shop is currently open at all times. Sunday remains appointment-only as previously listed.

## Requires the live site and account access

Local verification on 31 October 2026: 193 tests passed, including MySQL integration tests. The production build passed. The expanded storefront smoke check covered the service directory and all seven enabled service pages, found 28 sitemap URLs, and reported no blockers in its checks. An unknown service rendered a noindex not-found response (Next.js may retain HTTP 200 once streaming has started). These checks do not establish Google indexing or real mobile speed.

1. Confirm the real domain in `NEXT_PUBLIC_SITE_URL` before deployment. Canonicals and sitemap currently default to `https://emanajewelry.com`.
2. Verify Google Search Console using DNS ownership or the HTML tag supported by Admin → Search & SEO. Verify Bing similarly or import the verified Google property. A blank meta tag does not prove a property lacks DNS verification.
3. Submit `/sitemap.xml` in those accounts, inspect the homepage, a product, and a service, and check indexing reports. Do not interpret a saved verification code as verified ownership or ranking evidence.
4. Confirm ownership of the real Google Business Profile and align its address, telephone, opening hours, website, and services. Add genuine official social profiles to the CMS. Do not create duplicate business listings or fabricate reviews.
5. Run mobile PageSpeed Insights against OrangeHost, then monitor field Core Web Vitals once enough real visits exist. Check LCP, INP, and CLS. Local response times are not mobile scores.
6. Test public URLs in Google's Rich Results Test and Search Console URL Inspection. Generic Service schema describes the page; it does not promise a special Google rich result. The enquiry-only catalog intentionally omits invented prices.
7. Once the shop video exists, supply its actual YouTube URL and publish date before adding video-specific structured data. The current homepage section stays hidden without a valid video URL.

## Sources

- [Google local business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Google AI features and websites](https://developers.google.com/search/docs/appearance/ai-features)
- [Google video structured data](https://developers.google.com/search/docs/appearance/structured-data/video)
- [Google merchant listing price requirements](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)

The website work improves crawlability and useful content. Indexing, visibility, conversions, and mobile field performance need live measurement; no ranking guarantee is implied.
