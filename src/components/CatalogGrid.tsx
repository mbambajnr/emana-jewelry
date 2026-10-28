import { METAL_OPTIONS, photosForMetal } from "@/lib/product-options"
import { catalogWhere } from "@/lib/catalog-search"
import { redirect } from "next/navigation"
import { CATALOG_PAGE_SIZE, catalogQuery, catalogHref, visiblePageNumbers, type CatalogSearchParams } from "@/lib/catalog-navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import ProductCardImage from "./ProductCardImage"
import { WishlistButton } from "./WishlistButton"
import { WhatsappButton } from "./WhatsappButton"
import styles from "@/app/catalog/catalog.module.css"

export default async function CatalogGrid({ searchParams = Promise.resolve({}) }: { searchParams?: Promise<CatalogSearchParams> } = {}) {
  const { category, page, q, metal, sort } = catalogQuery(await searchParams)
  const where = catalogWhere(category, q, metal)
  let collections, total
  try {
    [collections, total] = await Promise.all([
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true, _count: { select: { products: { where: catalogWhere("", q, metal) } } } } }),
      prisma.product.count({ where }),
    ])
  } catch { return <p data-catalog-grid-ready role="alert">We couldn’t load the catalog. Please refresh and try again.</p> }
  const pages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE))
  if (page > pages) redirect(catalogHref(category, pages, q, metal, sort))
  let products
  try {
    products = await prisma.product.findMany({
      where,
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
      orderBy: sort === "name" ? [{ name: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, slug: true, name: true, subcategory: true, images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true, metal: true, sortOrder: true } } },
    })
  } catch {
    return <p data-catalog-grid-ready role="alert">We couldn’t load the catalog. Please refresh or <a href="https://wa.me/233242186590" target="_blank" rel="noreferrer">speak with us on WhatsApp</a>.</p>
  }
  return <section data-catalog-grid-ready>
    <form action="/catalog" method="get" className={styles.searchForm} key={`${category}:${q}:${metal}:${sort}`}>
      {category && <input type="hidden" name="category" value={category} />}
      <label htmlFor="catalog-search">Find your next piece</label>
      <div><input id="catalog-search" type="search" name="q" defaultValue={q} maxLength={120} placeholder="Search necklaces, rings…" /></div>
      <div className={styles.filterControls}>
        <label htmlFor="catalog-metal">Metal<select id="catalog-metal" name="metal" defaultValue={metal || ""}><option value="">All metals</option>{METAL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
        <label htmlFor="catalog-sort">Sort by<select id="catalog-sort" name="sort" defaultValue={sort}><option value="newest">Newest</option><option value="name">Name: A–Z</option></select></label>
        <button type="submit">Apply</button>
      </div>
      {q && <p>Results for “{q}” · <Link href={catalogHref(category, 1, "", metal, sort)}>Clear search</Link></p>}
    </form>
    <nav className={styles.categories} aria-label="Shop by category">
      <h2>Shop by Category</h2>
      <div className={styles.categoryList}>
        <Link href={catalogHref("", 1, q, metal, sort)} className={styles.category} aria-current={!category ? "page" : undefined}>All Jewelry</Link>
        {collections.map(collection => <Link key={collection.slug} href={catalogHref(collection.slug, 1, q, metal, sort)} className={styles.category} aria-current={category === collection.slug ? "page" : undefined}>{collection.name} <span>({collection._count.products})</span></Link>)}
      </div>
    </nav>
    <div className={styles.results}><p className={styles.count}>{total ? `Showing ${(page - 1) * CATALOG_PAGE_SIZE + 1}–${Math.min(page * CATALOG_PAGE_SIZE, total)} of ${total} pieces` : "No pieces found"}</p>{category && <Link href={catalogHref("", 1, q, metal, sort)}>Clear category ×</Link>}</div>
    {(q || category || metal || sort !== "newest") && <div className={styles.activeFilters} aria-label="Current filters">
      {metal && <Link href={catalogHref(category, 1, q, undefined, sort)}>Remove {metal} ×</Link>}
      {(q || category || metal) && <Link href="/catalog">Clear all filters ×</Link>}
      <span>Sorted by {sort === "name" ? "name: A–Z" : "newest"}</span>
    </div>}
    {products.length ? <div className={styles.grid}>{products.map(product => {
      const images = photosForMetal(product.images, metal)
      const href = `/products/${encodeURIComponent(product.slug)}${metal ? `?metal=${metal}` : ""}`
      return <article className={styles.card} key={product.id} data-product-card>
        <div className={styles.imageArea}>
          <Link href={href} className={styles.imageLink} aria-label={`View ${product.name}`}>
            <ProductCardImage name={product.name} images={images} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
          </Link>
          <WishlistButton slug={product.slug} name={product.name} image={images[0]?.url || "/hero_bg.png"} subcategory={product.subcategory} className={styles.save} iconSize={18} />
        </div>
        <div className={styles.body}><h2><Link href={href}>{product.name}</Link></h2><WhatsappButton metal={metal} productName={product.name} productUrl={href} className={styles.inquiry} label="Enquire on WhatsApp" iconSize={16} /></div>
      </article>
    })}</div> : <p>{q || metal ? "No matching pieces. Try another word, clear the search, or choose a different category." : category ? "No pieces in this category yet. Choose another category or view all jewelry." : "New pieces will appear here soon."} <a href="https://wa.me/233242186590" target="_blank" rel="noreferrer">Ask us what’s available.</a></p>}
    <nav className={styles.pagination} aria-label="Catalog pages">
      {page > 1 ? <Link href={catalogHref(category, page - 1, q, metal, sort)} rel="prev">← Previous</Link> : <span aria-disabled="true">← Previous</span>}
      <div className={styles.pageNumbers}>{visiblePageNumbers(page, pages).map((number, index) => number === "gap" ? <span key={`gap-${index}`} aria-hidden="true">…</span> : <Link key={number} href={catalogHref(category, number, q, metal, sort)} aria-label={`Page ${number}`} aria-current={page === number ? "page" : undefined}>{number}</Link>)}</div>
      {page < pages ? <Link href={catalogHref(category, page + 1, q, metal, sort)} rel="next">Next →</Link> : <span aria-disabled="true">Next →</span>}
      <p>Page {page} of {pages}</p>
    </nav>
  </section>
}
