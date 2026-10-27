# Gold and Silver choices

Each product has a `metalOptions` list. The migration adds Gold and Silver to existing products without changing names, descriptions, material specifications, photos, or saved requests. New products default to both choices.

In Admin → Products → Add/Edit, select Gold, Silver, or both under **Metal choices for clients**. At least one is required. These are choices clients can request; they do not establish purity, plating, stock, or price. Existing material specifications remain separate, and the shop confirms the material, finish, availability, and quotation.

The product page shows a radio group before quantity and enquiry actions. The first configured option is selected initially. Selecting another option updates the WhatsApp product message and the quote-list item. Catalog shortcuts without a choice continue to create a general enquiry.

Quote items are identified by product slug plus selected metal. Gold and Silver versions of one piece remain separate; quantity/removal affects only its own line. Older browser quote lists without metal choices remain readable. On form submission the server checks that each selected metal is still offered and saves it with the catalog's product name. Invalid or removed choices are rejected before saving.

The selection appears in the client's quote list, saved admin inquiry, notification emails, and WhatsApp quote summaries. Historical requests without a metal remain unchanged. Wishlist entries continue to save the product rather than a metal variant.

Deployment: run `npx prisma migrate deploy` and `npx prisma generate`. The migration adds one PostgreSQL text-array column. The existing numeric price fields stay unpriced; this feature does not introduce checkout or separate variant prices.
