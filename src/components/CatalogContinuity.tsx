"use client"
import { useEffect, type ReactNode } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { readBrowsingPosition, saveBrowsingPosition } from "@/lib/browsing-position"

export default function CatalogContinuity({ children }: { children: ReactNode }) {
  const pathname = usePathname(), query = useSearchParams().toString()
  useEffect(() => {
    if (window.location.hash !== "#continue-browsing") return
    const position = readBrowsingPosition()
    const path = window.location.pathname + window.location.search
    if (!position || position.path !== path) return
    let frame = 0
    const restore = () => {
      if (!document.querySelector("[data-catalog-grid-ready]")) return
      observer.disconnect()
      frame = requestAnimationFrame(() => {
        window.scrollTo({ top: position.y, behavior: "instant" })
        window.history.replaceState(window.history.state, "", path)
      })
    }
    const observer = new MutationObserver(restore)
    observer.observe(document.body, { childList: true, subtree: true })
    restore()
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [pathname, query])
  return <div onClickCapture={event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    if (!(event.target instanceof Element)) return
    const link = event.target.closest("a")
    if (link && link.origin === window.location.origin && link.pathname.startsWith("/products/")) saveBrowsingPosition(window.location.pathname + window.location.search, window.scrollY)
  }}>{children}</div>
}
