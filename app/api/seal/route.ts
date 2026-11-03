import { appendEntry } from "@/lib/ledger"
import { merkleRoot } from "@/lib/merkle"
import { isLanguageCode, type LeafRecord } from "@/lib/types"

const HEX64 = /^[0-9a-f]{64}$/

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 })

  const leaves: LeafRecord[] = Array.isArray(body.leaves)
    ? body.leaves.slice(0, 40).map((l: LeafRecord) => ({ label: String(l.label).slice(0, 80), hash: String(l.hash) }))
    : []
  if (!leaves.length || leaves.some((l) => !HEX64.test(l.hash)))
    return Response.json({ error: "Invalid Merkle leaves." }, { status: 400 })

  const root = await merkleRoot(leaves.map((l) => l.hash))
  if (root !== body.root) return Response.json({ error: "Merkle root does not match leaves." }, { status: 400 })

  const m = body.metadata ?? {}
  if (!isLanguageCode(m.language)) return Response.json({ error: "Unsupported language." }, { status: 400 })

  const entry = await appendEntry({
    root,
    leaves,
    metadata: {
      doc_type: String(m.doc_type ?? "Document").slice(0, 80),
      trust_score: Math.min(100, Math.max(0, Math.round(Number(m.trust_score) || 0))),
      trust_label: String(m.trust_label ?? "").slice(0, 20),
      language: m.language,
      summary: String(m.summary ?? "").slice(0, 1000),
      field_keys: Array.isArray(m.field_keys) ? m.field_keys.slice(0, 20).map(String) : [],
      edited_fields: Array.isArray(m.edited_fields) ? m.edited_fields.slice(0, 20).map(String) : [],
      voice_match: Boolean(m.voice_match),
    },
  })
  return Response.json({ entry })
}
