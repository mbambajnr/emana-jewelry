import { isMetalOption, type MetalOption } from "@/lib/product-options"
import RelatedProducts from "@/components/RelatedProducts"
import { decodeProductSlug } from "@/lib/product-links"
import { absoluteUrl } from "@/lib/seo"
import { Suspense } from "react"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"

import Header from "@/components/Header"
import ProductDetailClient, { type ProductFromDb } from "./product-detail-client"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeProductSlug(rawSlug)
  let product: { name: string; description: string; images: { url: string }[] } | null = null

  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
    })
  } catch {
    return { title: "Product temporarily unavailable", robots: { index: false } }
  }

  if (!product) return { title: "Product Not Found", robots: { index: false } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emanajewelries.com"
  const productUrl = `${siteUrl}/products/${encodeURIComponent(slug)}`
  const imageUrl = product.images[0]?.url ? absoluteUrl(product.images[0].url) : undefined

  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: productUrl },
    openGraph: {
      title: product.name,
      description: product.description,
      url: productUrl,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 1200 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

async function ProductContent({ slug, initialMetal }: { slug: string; initialMetal?: MetalOption }) {
  let product: ProductFromDb | null = null

  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        materials: true,
        stones: true,
        details: { orderBy: { sortOrder: "asc" } },
        reviews: true,
        category: true,
      },
    })
  } catch {
    return <p role="alert" style={{ padding: "120px 24px" }}>We couldn’t load this piece. Please try again shortly.</p>
  }

  if (!product) notFound()

  return <ProductDetailClient key={`${product.id}:${initialMetal || "default"}`} initialMetal={initialMetal} product={{ ...product, price: 0, originalPrice: null }} relatedProducts={<Suspense fallback={null}><RelatedProducts slug={product.slug} category={product.category.slug} subcategory={product.subcategory} /></Suspense>} />
}

async function ProductPageContent({ paramsPromise, searchParams }: { paramsPromise: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await paramsPromise
  const { metal } = await searchParams
  return <ProductContent slug={decodeProductSlug(slug)} initialMetal={isMetalOption(metal) ? metal : undefined} />
}

export default function ProductDetailPage({
  params, searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  params: Promise<{ slug: string }>
}) {
  return (
    <>
      <Header />
      <Suspense fallback={<p role="status" style={{ padding: "120px 24px" }}>Loading this piece…</p>}>
        <ProductPageContent paramsPromise={params} searchParams={searchParams} />
      </Suspense>
    </>
  )
}
