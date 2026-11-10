# Search and buying information

Manage public shop details under **Website Content → Shop details & search information**. These fields supply the homepage business schema, service provider schema, footer/location details, standard contact/hours FAQ answers and key enquiry links. Public shop contact information is separate from admin authentication and the shop-notification recipient.

Use international phone format, for example +233242186590. Monday–Friday and Saturday accept `09:00-18:00` or `Closed`. Closing must be later than opening. Sunday has a guidance note, not an assumed structured opening schedule. The initial weekday/Saturday defaults preserve the confirmed 9am–6pm schedule. Publish CMS edits before expecting search engines or customers to see them.

Manage the four direct buying answers under **Buying guidance & search answers**. They cover requesting a price, collection/delivery, custom-design timing and missing Gold/Silver images. Their rendered text is included in the FAQ page's structured data as well as visible content. This is not a promise of a FAQ rich result or an AI citation. The page links to the catalogue, services and location.

Standard FAQ answers support `{{shop.address}}`, `{{shop.phone}}`, `{{shop.email}}`, `{{shop.weekdays}}`, `{{shop.saturday}}` and `{{shop.sundayNote}}`. Both visible answers and FAQ structured data resolve these from the same published document. The private draft preview resolves them from the draft. Custom prose without placeholders is retained: review any manually written contact details after changing the shop's location or contacts.

Legacy FAQ handling matches both the original question and exact original answer. Only untouched built-in answers are upgraded to the new default wording; edited answers are preserved. This resolves the old Saturday-hours conflict and removes unconfirmed default production lead times, return deadlines and sourcing guarantees without overwriting staff-written content. It does not edit the database directly. A subsequent normal CMS save records the edited document with the existing version/revision protections.

For product descriptions, use original details about the actual piece, supported materials and finish. Add size, care and delivery notes where known, plus accurate image descriptions. Do not invent certifications, reviews, delivery promises or prices for search markup. Quote-only products retain their quote-based behaviour.

The business currently remains Emana Jewelry in Ghana; editing contact/location fields does not rename the brand or change the country. Marketing headlines, old appointment value identifiers and freeform copy can contain location references and should be reviewed separately after a physical move. Stored enquiry/booking snapshots are not rewritten.

After public deployment, verify the final HTTPS origin, Search Console/Bing ownership, sitemap and index status, structured-data output, Google Business Profile consistency and real mobile performance. Business directory/profile changes and live indexing were not performed by these source changes. There is no guarantee of rankings, rich results or inclusion in AI-generated answers.
