import type { Comparison, ExtractedField, SanityCheck, TrustBreakdown } from "@/lib/types"

const round1 = (n: number) => Math.round(n * 10) / 10

// Deterministic: the LLM never decides the score, it only supplies inputs.
export function computeTrust(
  fields: ExtractedField[],
  comparison: Comparison | null,
  sanity: SanityCheck | null,
): TrustBreakdown {
  const avgConfidence = fields.length ? fields.reduce((s, f) => s + f.confidence, 0) / fields.length : 0
  const ocr = avgConfidence * 35

  const matched = comparison?.matched_fields.length ?? 0
  const mismatched = comparison?.mismatches.length ?? 0
  const claimed = matched + mismatched
  const matchRatio = claimed ? matched / claimed : 0
  const voice = matchRatio * 30

  const flags = sanity?.red_flags.length ?? 0
  const sanityScore = Math.max(0, 20 - flags * 7)

  const editedCount = fields.filter((f) => f.edited).length
  const editRatio = fields.length ? editedCount / fields.length : 0
  const edits = (1 - editRatio) * 15

  const score = Math.round(ocr + voice + sanityScore + edits)
  const label = score >= 80 ? "High" : score >= 55 ? "Medium" : "Needs review"

  return {
    score,
    label,
    parts: [
      { name: "OCR confidence", weight: 35, earned: round1(ocr), detail: `Average field confidence ${Math.round(avgConfidence * 100)}%` },
      {
        name: "Voice claim match",
        weight: 30,
        earned: round1(voice),
        detail: claimed ? `${matched} of ${claimed} spoken claims matched the document` : "No verifiable claims in the attestation",
      },
      { name: "Document sanity", weight: 20, earned: round1(sanityScore), detail: flags ? `${flags} red flag${flags > 1 ? "s" : ""} raised` : "No red flags" },
      {
        name: "Human edits",
        weight: 15,
        earned: round1(edits),
        detail: editedCount ? `${editedCount} of ${fields.length} fields edited by user` : "No fields edited",
      },
    ],
  }
}
