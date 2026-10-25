import { describe, it, expect } from "vitest"
import { verificationToken } from "@/lib/search-verification"

describe("Search verification code parsing", () => {
  it("accepts provider tokens and extracts the matching HTML tag", () => {
    expect(verificationToken(" abc_123-def ", "google")).toBe("abc_123-def")
    expect(verificationToken('<meta name="google-site-verification" content="abc_123" />', "google")).toBe("abc_123")
    expect(verificationToken("<meta content='ABC123' name='msvalidate.01'>", "bing")).toBe("ABC123")
  })
  it("rejects the wrong provider, unsafe markup, missing values, and oversized codes", () => {
    expect(() => verificationToken('<meta name="msvalidate.01" content="ABC123">', "google")).toThrow()
    expect(() => verificationToken('<script>alert(1)</script>', "google")).toThrow()
    expect(() => verificationToken('<meta name="google-site-verification" content="x"><script>bad</script>', "google")).toThrow()
    expect(() => verificationToken(null, "google")).toThrow()
    expect(() => verificationToken("a".repeat(257), "google")).toThrow()
  })
  it("allows removing a code with a blank field", () => {
    expect(verificationToken("  ", "bing")).toBe("")
  })
})
