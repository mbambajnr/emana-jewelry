export type ProductCategory =
  | "rings"
  | "necklaces"
  | "earrings"
  | "bracelets"
  | "wedding"
  | "luxury"
  | "mens"
  | "custom"

export type ProductSubcategory =
  | "Engagement"
  | "Signet"
  | "Anniversary"
  | "Wedding Band"
  | "Pendant"
  | "Chain"
  | "Locket"
  | "Pearls"
  | "Drop"
  | "Stud"
  | "Hoop"
  | "Chandelier"
  | "Bangle"
  | "Charm"
  | "Cuff"
  | "Bridal Set"
  | "Eternity Band"
  | "Parure"
  | "Statement"
  | "Rare Gem"
  | "Bands"
  | "Cufflinks"

export interface StoneSpecs {
  type: string
  carat: string
  clarity?: string
  color?: string
  cut?: string
  certification?: string
}

export interface MaterialDetail {
  metal: string
  purity: string
  weight?: string
}

export interface Review {
  id: string
  author: string
  rating: number
  text: string
  date: string
}

export interface Product {
  youtubeUrl?: string | null
  id: string
  name: string
  slug: string
  category: ProductCategory
  subcategory?: string
  price: number
  originalPrice?: number
  description: string
  details: string[]
  images: string[]
  materials: MaterialDetail[]
  stones: StoneSpecs[]
  available: boolean
  sku: string
  reviews: Review[]
  rating: number
  reviewCount: number
}

export interface Collection {
  slug: ProductCategory
  name: string
  description: string
  image: string
  count: number
}

export const collections: Collection[] = [
  {
    slug: "rings",
    name: "Rings",
    description: "Rings for everyday wear, engagements, and special occasions, in a range of materials and finishes.",
    image: "/gold_signet_ring.jpg",
    count: 0,
  },
  {
    slug: "necklaces",
    name: "Necklaces",
    description: "Pendants, chains, and necklaces in styles inspired by our West African heritage and your everyday life.",
    image: "/african_gold_necklace.jpg",
    count: 0,
  },
  {
    slug: "earrings",
    name: "Earrings",
    description: "Studs, hoops, and drop earrings in materials and finishes to suit your style.",
    image: "/royal_sapphire_ring.jpg",
    count: 0,
  },
  {
    slug: "bracelets",
    name: "Bracelets",
    description: "Bangles, bracelets, and cuffs for everyday wear or a special occasion.",
    image: "/diamond_bracelet.jpg",
    count: 0,
  },
  {
    slug: "wedding",
    name: "Wedding Jewelry",
    description: "Bridal sets, bands, and celebration heirlooms crafted to order.",
    image: "/hero_bg.png",
    count: 0,
  },
  {
    slug: "luxury",
    name: "Luxury Collections",
    description: "Standout pieces with thoughtful details, distinctive finishes, and carefully chosen stones.",
    image: "/hero_gold_necklace.jpg",
    count: 0,
  },
  {
    slug: "mens",
    name: "Men's Jewelry",
    description: "Signet rings, chains, bands, and more, in materials and styles that feel like you.",
    image: "/gold_signet_ring.jpg",
    count: 0,
  },
  {
    slug: "custom",
    name: "Custom Jewelry",
    description: "Tell us your idea and we’ll make a piece just for you.",
    image: "/bespoke_drafting.jpg",
    count: 0,
  },
]

// Real product catalog ready for input via Admin Dashboard (/admin/products/new)
export const products: Product[] = []

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category)
}

export function getCollection(slug: ProductCategory): Collection | undefined {
  return collections.find((c) => c.slug === slug)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export const staticProducts = products
export const staticCollections = collections
