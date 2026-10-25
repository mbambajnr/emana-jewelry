import { publicSocialLinks } from "@/lib/social-settings"
export async function GET() {
  return Response.json(await publicSocialLinks(), { headers: { "Cache-Control": "no-store" } })
}
