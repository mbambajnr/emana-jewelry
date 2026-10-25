export interface SearchVerification {
  googleVerification: string
  bingVerification: string
}

/** Accept the provider's complete meta tag or its content value, never arbitrary markup. */
export function verificationToken(value: unknown, provider: "google" | "bing"): string {
  if (typeof value !== "string") throw new Error("Please enter a verification code.")
  const input = value.trim()
  if (!input) return ""
  const name = provider === "google" ? "google-site-verification" : "msvalidate.01"
  let token = input
  if (input.startsWith("<")) {
    if (!/^<meta\s[^<>]*\/?>$/i.test(input)) throw new Error("Paste the verification code or the single meta tag provided.")
    const attributes = [...input.matchAll(/([\w.-]+)\s*=\s*(["'])(.*?)\2/g)]
    const attrs = Object.fromEntries(attributes.map(match => [match[1].toLowerCase(), match[3]]))
    if (attrs.name !== name || !attrs.content) throw new Error(`Please use the ${provider === "google" ? "Google" : "Bing"} verification tag.`)
    token = attrs.content
  }
  if (token.length > 256 || !/^[A-Za-z0-9_-]+$/.test(token)) throw new Error("That code does not look right. Please copy it again from Google or Bing.")
  return token
}
