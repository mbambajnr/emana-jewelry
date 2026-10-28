import { describe, expect, it } from "vitest"
import { mysqlConnectionOptions } from "@/lib/mysql-config"
describe("MySQL connection configuration", () => {
  it("decodes cPanel credentials and uses a small connection pool", () => {
    expect(mysqlConnectionOptions("mysql://shop%40host:p%40ss%2Fword@localhost:3307/account_shop")).toMatchObject({ user: "shop@host", password: "p@ss/word", host: "localhost", port: 3307, database: "account_shop", connectionLimit: 3, charset: "utf8mb4", timezone: "Z" })
  })
  it("supports verified TLS without exposing a connection URL in errors", () => {
    expect(mysqlConnectionOptions("mysql://user:secret@db.example/shop?sslaccept=strict&connection_limit=2")).toMatchObject({ ssl: { rejectUnauthorized: true }, connectionLimit: 2 })
    for (const value of [undefined, "bad-url", "postgresql://user:secret@localhost/shop", "mysql://user:secret@localhost/shop?sslaccept=accept_invalid_certs", "mysql://user:secret@localhost/shop?connection_limit=100"]) {
      expect(() => mysqlConnectionOptions(value)).toThrow()
      try { mysqlConnectionOptions(value) } catch (error) { expect(String(error)).not.toContain("secret") }
    }
  })
})
