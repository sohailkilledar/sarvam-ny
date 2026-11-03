import { extractFields } from "@/services/sarvam"

export const maxDuration = 120

const MAX_BYTES = 10 * 1024 * 1024

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const file = form?.get("document")
  if (!(file instanceof File)) return Response.json({ error: "Upload a document image." }, { status: 400 })
  if (!file.type.startsWith("image/") && file.type !== "application/pdf")
    return Response.json({ error: "Only images or PDFs are supported." }, { status: 400 })
  if (file.size > MAX_BYTES) return Response.json({ error: "File must be under 10 MB." }, { status: 400 })

  const { data, mock } = await extractFields(file)
  return Response.json({ fields: data, mock })
}
