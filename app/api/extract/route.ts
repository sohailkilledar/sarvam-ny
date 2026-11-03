import { extractFields } from "@/services/sarvam"

export const maxDuration = 120

const MAX_BYTES = 10 * 1024 * 1024

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const file = form?.get("document")
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Upload a document image or PDF." }, { status: 400 })
  if (!file.type.startsWith("image/") && file.type !== "application/pdf")
    return Response.json({ error: "Only images or PDFs are supported." }, { status: 400 })
  if (file.size > MAX_BYTES) return Response.json({ error: "File must be under 10 MB." }, { status: 400 })

  try {
    const { data, mock } = await extractFields(file)
    return Response.json({ fields: data, mock })
  } catch (error) {
    console.error("[pramaan] document extraction request failed:", error instanceof Error ? error.message : error)
    return Response.json(
      { error: "Document extraction failed. Verify API_KEY_SARVAM and try again." },
      { status: 502 },
    )
  }
}
