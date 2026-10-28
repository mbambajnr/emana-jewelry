export function mysqlConnectionOptions(connectionString: string | undefined) {
  if (!connectionString) throw new Error("Configure DATABASE_URL for the MySQL database.")
  let url: URL
  try { url = new URL(connectionString) } catch { throw new Error("DATABASE_URL must be a valid MySQL connection URL.") }
  if (url.protocol !== "mysql:" || !url.hostname || !url.pathname.slice(1)) throw new Error("DATABASE_URL must use mysql:// and include a database name.")
  const limit = Number(url.searchParams.get("connection_limit") || 3)
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("Use a database connection_limit between 1 and 20.")
  const ssl = url.searchParams.get("sslaccept")
  if (ssl && ssl !== "strict") throw new Error("Use sslaccept=strict for verified database TLS.")
  return {
    host: url.hostname, port: Number(url.port || 3306),
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: limit, connectTimeout: 5000, acquireTimeout: 10000, charset: "utf8mb4", timezone: "Z", initSql: "SET time_zone = '+00:00'",
    ...(ssl ? { ssl: { rejectUnauthorized: true } } : {}),
  }
}
