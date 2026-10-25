"use client"

import { useState, useEffect } from "react"
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist"

interface WishlistButtonProps {
  slug: string
  name: string
  image: string
  subcategory: string | null
  className?: string
  iconSize?: number
}

export function WishlistButton({
  slug,
  name,
  image,
  subcategory,
  className = "",
  iconSize = 18,
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    const handler = () => setWishlisted(isInWishlist(slug))
    window.addEventListener("wishlist", handler)
    setTimeout(handler, 0)
    return () => window.removeEventListener("wishlist", handler)
  }, [slug])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (wishlisted) {
      removeFromWishlist(slug)
      setWishlisted(false)
    } else {
      addToWishlist({ slug, name, image, subcategory })
      setWishlisted(true)
    }
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  )
}
