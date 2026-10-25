/** Only recognized YouTube URLs are converted into embed IDs. */
export function youtubeVideoId(value?: string | null): string | null {
  if (!value?.trim()) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    const host = url.hostname.toLowerCase()
    let id: string | null = null
    if (host === "youtu.be" || host === "www.youtu.be") id = url.pathname.split("/")[1]
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
      const parts = url.pathname.split("/")
      id = url.pathname === "/watch" ? url.searchParams.get("v") : ["embed", "shorts", "live"].includes(parts[1]) ? parts[2] : null
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
  } catch { return null }
}

export function normalizeYoutubeUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "string") throw new Error("Please enter a YouTube link.")
  if (!value.trim()) return null
  const id = youtubeVideoId(value)
  if (!id) throw new Error("Please enter a valid YouTube watch, Shorts, or share link.")
  return `https://www.youtube.com/watch?v=${id}`
}
