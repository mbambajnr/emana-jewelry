import { describe, expect, it } from "vitest"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient, type Prisma } from "@/generated/prisma/client"
import { mysqlConnectionOptions } from "@/lib/mysql-config"
import { catalogWhere } from "@/lib/catalog-search"
import { defaultContent } from "@/lib/site-content"

// Opt-in only: run against the local migrated MySQL target, never the source.
describe.skipIf(process.env.RUN_MYSQL_INTEGRATION !== "1")("MySQL integration", () => {
  it("preserves catalogue, CMS, requests, and analytics behaviours in a rolled-back transaction", async () => {
    const db = new PrismaClient({ adapter: new PrismaMariaDb(mysqlConnectionOptions(process.env.DATABASE_URL)) })
    const content = defaultContent as unknown as Prisma.InputJsonValue
    const baseline = await db.product.count()
    const longEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.com`
    const marker = `mysql-check-${crypto.randomUUID()}`
    const rollback = new Error("Verification transaction rolled back")
    try {
      await expect(db.$transaction(async tx => {
        const zone = await tx.$queryRaw<{ zone: string }[]>`SELECT @@session.time_zone AS zone`
        expect(zone[0].zone).toBe("+00:00")
        const category = await tx.category.create({ data: { slug: marker, name: "Verification", description: "Verification only", image: "/logo.png" } })
        const product = await tx.product.create({ data: { slug: `${marker}-silver`, name: "Ghanaian Signet — Adinkra ✨", categoryId: category.id, price: 0, description: "Detailed jewelry description. ".repeat(100), sku: marker, metalOptions: ["Gold", "Silver"], subcategory: "Signet", careInstructions: "Use a soft cloth. ".repeat(100), images: { create: { url: "/test-silver.jpg", metal: "Silver", alt: "A silver signet ring" } }, materials: { create: { metal: "Silver", purity: "925" } } } })
        await tx.product.create({ data: { slug: `${marker}-gold`, name: "Gold only", categoryId: category.id, price: 0, description: "Gold signet", sku: `${marker}-G`, metalOptions: ["Gold"] } })
        const matches = await tx.product.findMany({ where: catalogWhere(category.slug, "SILVER SIGNET", "Silver") })
        expect(matches.map(item => item.id)).toEqual([product.id])
        expect(matches[0].metalOptions).toEqual(["Gold", "Silver"])
        expect(matches[0].description.length).toBeGreaterThan(191)
        expect((await tx.product.findMany({ where: { categoryId: category.id, subcategory: { equals: "signet" } } })).map(item => item.id)).toEqual([product.id])
        const order = await tx.order.create({ data: { name: "Verification only", email: longEmail, phone: "0000000000", address: "Verification only", total: 0, items: [{ slug: product.slug, metal: "Silver", quantity: 2 }], notes: "n".repeat(1000) } })
        expect(order.email).toBe(longEmail)
        const activity = await tx.requestActivity.create({ data: { requestKind: "inquiry", requestId: order.id, fromStatus: "new", toStatus: "contacted", note: "n".repeat(2000), actor: longEmail } })
        expect(activity.note).toHaveLength(2000)
        expect(order.items).toEqual([{ slug: product.slug, metal: "Silver", quantity: 2 }])
        await tx.consultation.create({ data: { name: "Verification only", email: "test@example.invalid", service: "Jewelry care", notes: "n".repeat(1000), format: "in-person", date: "2026-11-01" } })
        const cms = await tx.siteContent.create({ data: { id: marker, draft: content, published: content } })
        expect(cms.draft).toEqual(defaultContent)
        expect((await tx.siteContent.updateMany({ where: { id: marker, version: 0 }, data: { version: { increment: 1 } } })).count).toBe(1)
        expect((await tx.siteContent.updateMany({ where: { id: marker, version: 0 }, data: { version: { increment: 1 } } })).count).toBe(0)
        await tx.contentRevision.create({ data: { action: "save", actor: "verification", content } })
        await tx.productView.create({ data: { productSlug: product.slug } })
        await tx.whatsAppClick.create({ data: { productSlug: product.slug, source: "/catalog", metal: "Silver" } })
        expect(await tx.productView.groupBy({ by: ["productSlug"], where: { productSlug: product.slug }, _count: { id: true } })).toEqual([{ productSlug: product.slug, _count: { id: 1 } }])
        throw rollback
      }, { timeout: 20000 })).rejects.toBe(rollback)
      expect(await db.product.count()).toBe(baseline)
      expect(await db.siteContent.findUnique({ where: { id: marker } })).toBeNull()
    } finally { await db.$disconnect() }
  })
})
