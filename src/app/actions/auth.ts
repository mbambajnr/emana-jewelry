"use server"

import { headers } from "next/headers"
import { consumeLimit, trustedClient, RequestError } from "@/lib/request-safety"
import { redirect } from "next/navigation"
import { createSession, deleteSession, verifyPassword } from "@/lib/auth"

export async function login(_prev: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const adminEmail = process.env.ADMIN_EMAIL
  const adminHash = process.env.ADMIN_PASSWORD_HASH

  if (typeof email !== "string" || typeof password !== "string" || !email || email.length > 254 || !password || password.length > 1024 || !adminEmail || !adminHash) {
    return { error: "Invalid credentials" }
  }

  try {
    await consumeLimit("login-site", "site", 50)
    await consumeLimit("login-account", email.trim().toLowerCase(), 8)
    const client = trustedClient(new Headers(await headers()))
    if (client) await consumeLimit("login-client", client, 12)
  } catch (error) { return { error: error instanceof RequestError ? error.message : "Sign-in is temporarily unavailable." } }

  const passwordValid = await verifyPassword(password, adminHash)
  if (email !== adminEmail || !passwordValid) return { error: "Invalid credentials" }

  await createSession(email)
  redirect("/admin")
}

export async function logout() {
  await deleteSession()
  redirect("/admin/login")
}
