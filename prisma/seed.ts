import "dotenv/config"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { mysqlConnectionOptions } from "../src/lib/mysql-config"
import { PrismaClient } from "../src/generated/prisma/client"
import { collections, products } from "../src/lib/products"

const adapter = new PrismaMariaDb(mysqlConnectionOptions(process.env.DATABASE_URL))

const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.review.deleteMany()
  await prisma.productDetail.deleteMany()
  await prisma.stone.deleteMany()
  await prisma.material.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.consultation.deleteMany()

  for (const col of collections) {
    await prisma.category.create({
      data: {
        slug: col.slug,
        name: col.name,
        description: col.description,
        image: col.image,
        sortOrder: collections.indexOf(col),
      },
    })
  }

  for (const prod of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: prod.category },
    })

    await prisma.product.create({
      data: {
        slug: prod.slug,
        name: prod.name,
        subcategory: prod.subcategory,
        price: prod.price,
        originalPrice: prod.originalPrice,
        description: prod.description,
        available: prod.available,
        sku: prod.sku,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        categoryId: category.id,
        images: {
          create: prod.images.map((url, i) => ({
            url,
            sortOrder: i,
          })),
        },
        materials: {
          create: prod.materials.map((m) => ({
            metal: m.metal,
            purity: m.purity,
            weight: m.weight,
          })),
        },
        stones: {
          create: prod.stones.map((s) => ({
            type: s.type,
            carat: s.carat,
            clarity: s.clarity,
            color: s.color,
            cut: s.cut,
            certification: s.certification,
          })),
        },
        details: {
          create: prod.details.map((text, i) => ({
            text,
            sortOrder: i,
          })),
        },
        reviews: {
          create: prod.reviews.map((r) => ({
            author: r.author,
            rating: r.rating,
            text: r.text,
            date: r.date,
          })),
        },
      },
    })
  }

  console.log("Database seeded successfully")
  console.log(`  ${collections.length} categories`)
  console.log(`  ${products.length} products`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
