# Website content management

Open **Admin → Website → Content, Services & FAQs** using the existing staff login. This is a structured CMS inside the application, backed by PostgreSQL.

## Editing and publishing

1. Change text or upload an image in **Page Content**, or use the **Services** and **FAQs** tabs.
2. Choose **Save Draft**. The live website continues to use the published document.
3. Open **Preview Draft**. The preview is restricted to signed-in staff, includes draft FAQs, and disables appointment submission.
4. Choose **Publish Changes**. Unsaved edits must be saved first. Publishing updates the public content cache and affected pages; refresh the website to see the new version.

The editor includes homepage welcome copy, quick links, highlights, custom design steps, materials and consultation sections, hero slides and buttons, featured-product headings, footer description/newsletter copy, the store introduction, and homepage search title/description. The existing product, collection, social-link, and search-verification editors remain separate. Layout, navigation destinations, contact routing, opening hours, and policy pages remain code-managed in this version.

Images can be selected by existing website paths or uploaded through the authenticated media endpoint. For new hero images, upload compressed photos; the existing default hero retains its responsive pre-encoded WebP variants. Development uploads remain local and must be migrated to production storage before deployment.

## Services

To change the **Cleaning & Repairs / Jewelry Cleaning & Repair Services** homepage block, open the **Services** tab. The **Homepage services section** panel contains the small heading, main heading, introduction, photo, and photo description. Upload a replacement image there, check its preview, save the draft, and publish. Individual services are edited below that panel. A direct editor link is `/admin/content?tab=services`.

Each service has a stable reference, name, description, appointment duration, type, and switches for enabled/homepage/appointments. Add a new service, save it, preview it, and publish it. That published list controls both homepage cards and the appointment dropdown. A service may appear on the homepage without being bookable, or be bookable without a homepage card.

Disabling or removing a service from the published list stops new bookings for it. Existing appointments keep their saved service description. A request from an older browser tab is checked against the current published list before saving. Draft-only services cannot be booked through the public API. The existing custom-jewelry links choose the first available custom-design service.

## History and concurrent editing

Every save, publication, or restoration creates a revision with the staff identity and timestamp. The original published document is also captured on the first write. The editor lists the latest 20 revisions; the database retains older revisions. **Restore as Draft** recovers the chosen content without immediately replacing the live website. Preview and publish it to make the restoration public.

Writes include the editor's expected version. If another tab saves first, the server rejects the stale write with 409 and the current tab retains its unsaved work. Reloading the editor retrieves the latest version; copy any unsaved work you want to keep before doing so.

## Data and security

`SiteContent` stores separate draft/published JSON documents and a version. `ContentRevision` stores snapshots. Admin reads require a valid staff session; writes additionally require a matching origin. The public layout and FAQ/search metadata read only the published document. The public booking handler also checks published services, rather than trusting the browser's list. Text is rendered as escaped React text; the CMS does not accept executable HTML or arbitrary image hosts.

Draft/publication controls apply to this CMS document. Product edits and other existing admin settings retain their own save behavior. Publishing is atomic across the document's copy, FAQs, and service list. Notifications keep the existing delivery integration and saved-request workflow.

Apply `npx prisma migrate deploy` and `npx prisma generate` when deploying. A new installation displays the built-in document until staff save or publish content. These CMS tables use PostgreSQL in development and production; they do not use the local-file fallback used by older social/search settings. Database failure prevents admin saves. The public content reader can fall back to built-in content during an outage; monitor failures and keep database backups.

## Extending the CMS

Add new fields to `src/lib/content-fields.json` with stable unique keys and bind the corresponding component to `useSiteContent()`. Keep existing keys stable: published documents and revisions refer to them. Missing newly added fields inherit their built-in defaults when a document is read. New section types or page layouts require implementation work; routine copy, image, FAQ, and service changes use the admin.

Back up both CMS tables together with the rest of the shop database. A Git push transfers the application and schema migrations, not staff-authored content or uploaded images.
