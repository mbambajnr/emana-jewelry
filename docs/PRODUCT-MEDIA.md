# Product gallery and product page

Product pages use a thumbnail gallery, product information, and a quote-request panel. On phones these stack in that order. Photos can be enlarged, navigated with buttons or keyboard arrows in the enlarged viewer, and swiped on touchscreens. Products without reviews do not show a made-up rating.

In Admin → Products → Add/Edit:

- Upload multiple supported images, or supply image URLs allowed by the site's Next.js image configuration.
- Reorder photos by dragging rows or using the up/down buttons. The first image is the cover used by catalog listings.
- Add a short description for each image for accessibility.
- Paste an optional YouTube watch/share/Shorts/live link. Invalid or unrelated URLs are rejected before saving. Clear it to remove the video.

The video uses YouTube's privacy-enhanced embed domain. No YouTube iframe is loaded until the visitor selects the video and presses play. Playback and embed permission still depend on the video's YouTube settings; a Watch on YouTube link is available if embedding fails.

Run `npx prisma generate` and `npx prisma migrate deploy` before deploying this schema. The product-media migration adds optional Product.youtubeUrl and ProductImage.alt. Existing product images remain in place. Product relation updates use a single nested database mutation so a failed update does not first delete the gallery.

Development-only design preview: `/preview/product`. It uses explicitly marked sample data, does not save cart/wishlist changes or send WhatsApp inquiries, emits no product structured data, is noindexed, and returns not found in production. Replace sample gallery angles with real photography when adding the actual catalog.

## Local photo uploads

During development, uploads are saved in `.data/product-images` and served through `/media/products/<uuid>.<extension>`. Keep this ignored folder with your local database; removing it removes local uploaded photos. These files are not deployed automatically. Production continues to use the Supabase `product-images` bucket. The currently configured storage hostname failed DNS lookup during troubleshooting and must be corrected/re-enabled before production uploads work.

The form shows upload errors returned by the API and reports broken previews rather than hiding them. Re-upload a photo whose earlier cloud upload failed. Local media URLs intentionally return 404 in production; upload the actual production media to durable cloud storage before migrating local catalog data.
