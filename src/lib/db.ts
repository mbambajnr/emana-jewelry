import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { mysqlConnectionOptions } from "./mysql-config"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaMariaDb(mysqlConnectionOptions(process.env.DATABASE_URL))

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
