"use client"

import { createContext, useContext, type ReactNode } from "react"
import { defaultContent, type SiteDocument } from "@/lib/site-content"
const ContentContext = createContext({ document: defaultContent, preview: false })
export function SiteContentProvider({ document, preview = false, children }: { document: SiteDocument; preview?: boolean; children: ReactNode }) {
  return <ContentContext.Provider value={{ document, preview }}>{children}</ContentContext.Provider>
}
export function useSiteContent() {
  const { document, preview } = useContext(ContentContext)
  return { ...document, preview }
}
