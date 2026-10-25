export interface FeaturedProduct {
  id: string
  slug: string
  name: string
  description: string
  category: string
  categoryName: string
  subcategory: string | null
  images: string[]
  price: number
  materials: { metal: string; purity: string }[]
  stones: { type: string; carat: string; certification: string | null }[]
}
