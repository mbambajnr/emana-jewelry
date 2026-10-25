"use client"
import { useEffect, useState } from "react"
import { clearRecentlyViewed, getRecentlyViewed } from "@/lib/recently-viewed"
import ProductRail, { type DiscoveryProduct } from "./ProductRail"
export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [products, setProducts] = useState<DiscoveryProduct[]>([])
  useEffect(() => {
    let controller: AbortController | undefined
    const load = async () => {
      controller?.abort(); controller = new AbortController()
      const slugs = getRecentlyViewed().filter(item => item.slug !== excludeSlug).slice(0, 4).map(item => item.slug)
      if (!slugs.length) { setProducts([]); return }
      try {
        const response = await fetch(`/api/products/lookup?${new URLSearchParams({ slugs: JSON.stringify(slugs) })}`, { signal: controller.signal })
        if (response.ok) setProducts(await response.json())
      } catch { /* A recommendation failure never blocks shopping. */ }
    }
    const timer = setTimeout(() => { void load() }, 0)
    const onStorage = () => { void load() }
    window.addEventListener("recently-viewed", onStorage); window.addEventListener("storage", onStorage)
    return () => { clearTimeout(timer); controller?.abort(); window.removeEventListener("recently-viewed", onStorage); window.removeEventListener("storage", onStorage) }
  }, [excludeSlug])
  return <ProductRail title="Recently viewed" subtitle="Saved on this browser for up to 30 days." products={products} action={<button onClick={() => { clearRecentlyViewed(); setProducts([]) }}>Clear history</button>} />
}
