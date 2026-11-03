import { speak } from "@/services/sarvam"
import { isLanguageCode } from "@/lib/types"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const text = typeof body?.text === "string" ? body.text.trim() : ""
  if (!text || !isLanguageCode(body?.language)) return Response.json({ error: "Invalid request." }, { status: 400 })

  const audio = await speak(text, body.language)
  if (!audio) return Response.json({ error: "Voice playback is unavailable right now." }, { status: 503 })
  return Response.json({ audio })
}
