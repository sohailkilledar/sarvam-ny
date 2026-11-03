import { compareClaim, sanityCheck, summarize, transcribe } from "@/services/sarvam"
import { computeTrust } from "@/services/trust"
import { isLanguageCode, type ExtractedField } from "@/lib/types"

export const maxDuration = 120

function parseFields(raw: FormDataEntryValue | null): ExtractedField[] | null {
  if (typeof raw !== "string") return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.slice(0, 20).map((f) => ({
      key: String(f.key).slice(0, 64),
      label: String(f.label ?? f.key).slice(0, 64),
      value: String(f.value ?? "").slice(0, 500),
      originalValue: String(f.originalValue ?? "").slice(0, 500),
      confidence: Math.min(1, Math.max(0, Number(f.confidence) || 0)),
      edited: String(f.value) !== String(f.originalValue),
    }))
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const audio = form?.get("audio")
  const language = form?.get("language")
  const fields = parseFields(form?.get("fields") ?? null)

  if (!(audio instanceof File) || audio.size === 0) return Response.json({ error: "Record your attestation first." }, { status: 400 })
  if (audio.size > 15 * 1024 * 1024) return Response.json({ error: "Recording is too long." }, { status: 400 })
  if (!audio.type.startsWith("audio/")) return Response.json({ error: "Please upload a valid audio recording." }, { status: 400 })
  if (!isLanguageCode(language)) return Response.json({ error: "Unsupported language." }, { status: 400 })
  if (!fields?.length) return Response.json({ error: "No document fields to compare against." }, { status: 400 })

  try {
    const transcript = await transcribe(audio, language)
    const [comparison, sanity, summary] = await Promise.all([
      compareClaim(transcript.data, fields),
      sanityCheck(fields),
      summarize(fields, language),
    ])

    return Response.json({
      transcript: transcript.data,
      comparison: comparison.data,
      sanity: sanity.data,
      summary: summary.data,
      trust: computeTrust(fields, comparison.data, sanity.data),
      mock: [transcript, comparison, sanity, summary].some((r) => r.mock),
    })
  } catch (error) {
    console.error("[attest] Sarvam attestation failed", error)
    return Response.json(
      { error: "Attestation could not be completed. Check the recording and try again." },
      { status: 502 },
    )
  }
}
