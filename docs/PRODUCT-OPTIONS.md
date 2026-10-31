# Gold and Silver choices

Each product has a `metalOptions` list. The migration adds Gold and Silver to existing products without changing names, descriptions, material specifications, photos, or saved requests. New products default to both choices.

In Admin → Products → Add/Edit, select Gold, Silver, or both under **Metal choices for clients**. At least one is required. These are choices clients can request; they do not establish purity, plating, stock, or price. Existing material specifications remain separate, and the shop confirms the material, finish, availability, and quotation.

The product page puts metal choices beside the gallery. A valid choice from the catalog URL is retained. Otherwise, a sole configured option is selected, or the first offered option with a tagged photo; if neither applies, the customer chooses. General photos never automatically imply Gold or Silver. Selecting an option updates the gallery, WhatsApp message, and quote-list item. Adding to the quote list requires a choice when options exist; a general WhatsApp price enquiry can still be sent without one. The quantity selected on the product page carries into both the quote list and WhatsApp enquiry.

Quote items are identified by product slug plus selected metal. Gold and Silver versions of one piece remain separate; quantity/removal affects only its own line. Older browser quote lists without metal choices remain readable. On form submission the server checks that each selected metal is still offered and saves it with the catalog's product name. Invalid or removed choices are rejected before saving.

The selection appears in the client's quote list, saved admin inquiry, notification emails, and WhatsApp quote summaries. Historical requests without a metal remain unchanged. Wishlist entries continue to save the product rather than a metal variant.

Deployment: apply the existing MySQL migrations with `npx prisma migrate deploy` and regenerate with `npx prisma generate`. Metal options use a JSON column in the current MySQL schema. The layout changes require no additional migration. Existing numeric price fields stay unpriced; this feature does not introduce checkout or separate variant prices.

## Matching photos to metal choices

Upload real photos of each version in the product editor. Each photo row has a **Photo version** dropdown: Gold, Silver, or General photo. Photo labels stay attached when rows are reordered or removed. Existing images default to General photo; their metal is not guessed from filenames, product names, or the appearance of other photos.

Selecting a metal on the product page resets the gallery and video state, shows that metal's first photo, and excludes photos labelled for the other metal. General photos remain available after matching photos. Without a tagged matching photo, the gallery identifies the images as references and asks the customer to confirm the option with the shop. If there are no general photos either, it shows a placeholder rather than an unrelated metal photo. Upload and label both versions to enable a visible Gold/Silver photo change; the app does not recolour product images.

Deploy the product-photo-metals migration before serving the updated product pages.
