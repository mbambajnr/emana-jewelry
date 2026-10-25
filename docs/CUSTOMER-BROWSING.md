# Customer browsing and return visits

- Catalog search uses `q` in the URL, matches each search word across names, descriptions, collection names, subcategories, materials, and stone types, and keeps the selected category when changing pages. A new search/category starts at page 1. Search result pages are noindexed and remain followable.
- Product views store only product slugs and timestamps in localStorage, bounded to 12 unique entries for 30 days. The interface shows up to four, refreshes their current names/photos through a limited public lookup, excludes deleted products, and provides Clear history. No account or cross-device synchronisation is implemented.
- Homepage, catalog, and product pages display recently viewed pieces when there is history. Product pages exclude the piece currently open. The development-only product preview does not add browsing history.
- Related pieces come from the current product's collection, exclude that product, and show up to four. No fabricated ratings or price information is added.
- Opening a product from the catalog stores that tab's catalog URL and scroll position in sessionStorage. Back to browsing returns to that exact URL and restores the position after catalog results render. Ordinary catalog visits do not automatically jump to an old position. Browser Back continues to use Next's normal restoration.

Optional browsing memory is designed to fail harmlessly when browser storage is blocked or product lookup is unavailable. The privacy page describes local storage and the history lifetime. This feature does not send marketing messages or introduce third-party behavioural tracking.
