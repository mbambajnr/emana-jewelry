import { saveEmailSettings } from "@/lib/email-settings-handler"
export async function POST(request: Request) { return saveEmailSettings(request, true) }
