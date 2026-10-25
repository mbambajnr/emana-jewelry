"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { readBrowsingPosition } from "@/lib/browsing-position"
export default function CatalogReturnLink() {
  const [path, setPath] = useState("/catalog")
  useEffect(() => {
    const timer = setTimeout(() => { const saved = readBrowsingPosition(); if (saved) setPath(`${saved.path}#continue-browsing`) }, 0)
    return () => clearTimeout(timer)
  }, [])
  return <Link href={path} style={{ display: "inline-block", marginBottom: 20, minHeight: 44, paddingBlock: 12, fontSize: ".85rem", color: "var(--gold-dark)" }}>← Back to browsing</Link>
}
