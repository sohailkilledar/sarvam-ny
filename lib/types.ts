export type LanguageCode = "hi-IN" | "mr-IN" | "ta-IN" | "te-IN" | "bn-IN" | "en-IN"

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "hi-IN", label: "Hindi", native: "हिन्दी" },
  { code: "mr-IN", label: "Marathi", native: "मराठी" },
  { code: "ta-IN", label: "Tamil", native: "தமிழ்" },
  { code: "te-IN", label: "Telugu", native: "తెలుగు" },
  { code: "bn-IN", label: "Bengali", native: "বাংলা" },
  { code: "en-IN", label: "English", native: "English" },
]

export function isLanguageCode(value: unknown): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value)
}

export type ExtractedField = {
  key: string
  label: string
  value: string
  originalValue: string
  confidence: number
  edited: boolean
}

export type Comparison = {
  match: boolean
  matched_fields: string[]
  mismatches: { field: string; said: string; found: string }[]
  summary: string
}

export type SanityCheck = {
  doc_type: string
  red_flags: string[]
}

export type TrustBreakdown = {
  score: number
  label: "High" | "Medium" | "Needs review"
  parts: { name: string; weight: number; earned: number; detail: string }[]
}

export type LeafRecord = { label: string; hash: string }

export type LedgerEntry = {
  id: string
  index: number
  timestamp: string
  prev_hash: string
  root: string
  leaves: LeafRecord[]
  metadata: {
    doc_type: string
    trust_score: number
    trust_label: string
    language: LanguageCode
    summary: string
    field_keys: string[]
    edited_fields: string[]
    voice_match: boolean
  }
  entry_hash: string
}
