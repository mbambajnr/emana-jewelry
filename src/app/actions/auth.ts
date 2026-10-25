"use server"

import { redirect } from "next/navigation"
import { createSession, deleteSession, verifyPassword } from "@/lib/auth"

export async function login(_prev: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const adminEmail = process.env.ADMIN_EMAIL
  const adminHash = process.env.ADMIN_PASSWORD_HASH

  if (!email || !password || !adminEmail || !adminHash) {
    return { error: "Invalid credentials" }
  }

  if (email !== adminEmail) {
    return { error: "Invalid credentials" }
  }

  if (!verifyPassword(password, adminHash)) {
    return { error: "Invalid credentials" }
  }

  await createSession(email)
  redirect("/admin")
}

export async function logout() {
  await deleteSession()
  redirect("/admin/login")
}
