import "server-only"
import { SarvamAIClient } from "sarvamai"
import type { Comparison, ExtractedField, LanguageCode, SanityCheck } from "@/lib/types"

const MOCK_MODE = process.env.MOCK_MODE === "true"
const REQUEST_OPTIONS = { timeoutInSeconds: 45, maxRetries: 1 }

let client: SarvamAIClient | null = null
function getClient() {
  const key = process.env.SARVAM_API_KEY
  if (!key) throw new Error("SARVAM_API_KEY is not set")
  client ??= new SarvamAIClient({ apiSubscriptionKey: key })
  return client
}

export type Result<T> = { data: T; mock: boolean }

async function withFallback<T>(name: string, live: () => Promise<T>, mock: () => T): Promise<Result<T>> {
  if (MOCK_MODE) return { data: mock(), mock: true }
  try {
    return { data: await live(), mock: false }
  } catch (error) {
    console.error(`[pramaan] ${name} failed:`, error instanceof Error ? error.message : error)
    throw error
  }
}

/* ---------- Document extraction (Sarvam Doc AI) ---------- */

const FIELD_SCHEMA = {
  document_type: "Type of the document, e.g. land record, sale deed, ration card, Aadhaar, certificate",
  holder_name: "Full name of the owner, holder or applicant named on the document",
  document_number: "Primary record, registration, certificate or ID number",
  property_identifier: "Survey, plot, khasra or property number if present",
  location: "Village, taluka, district, city or address as written",
  area_or_amount: "Land area, measurement or monetary amount if present",
  issue_date: "Date of issue or registration exactly as written",
  issuing_authority: "Department, office or authority that issued the document",
} as const

const FIELD_LABELS: Record<string, string> = {
  document_type: "Document type",
  holder_name: "Holder name",
  document_number: "Document number",
  property_identifier: "Property / survey no.",
  location: "Location",
  area_or_amount: "Area / amount",
  issue_date: "Issue date",
  issuing_authority: "Issuing authority",
}

const extractionSchema = JSON.stringify({
  type: "object",
  properties: Object.fromEntries(Object.entries(FIELD_SCHEMA).map(([k, description]) => [k, { type: "string", description }])),
})

const TERMINAL = new Set(["completed", "partially_completed", "failed", "rejected"])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function normalizeConfidence(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw)
  if (!Number.isFinite(n)) return 0.7
  return Math.min(1, Math.max(0, n > 1 ? n / 100 : n))
}

function toFields(result: Record<string, unknown>, annotations: Record<string, { confidence?: unknown }> = {}): ExtractedField[] {
  return Object.keys(FIELD_SCHEMA)
    .map((key) => {
      const value = result[key]
      if (value === null || value === undefined || String(value).trim() === "") return null
      const text = String(value).trim()
      return {
        key,
        label: FIELD_LABELS[key],
        value: text,
        originalValue: text,
        confidence: normalizeConfidence(annotations[key]?.confidence),
        edited: false,
      }
    })
    .filter((f): f is ExtractedField => f !== null)
}

const MOCK_FIELDS: ExtractedField[] = toFields(
  {
    document_type: "Land Record Extract (7/12)",
    holder_name: "Ramesh Shankar Patil",
    document_number: "MH-PN-2024-08812",
    property_identifier: "142/3B",
    location: "Wadgaon, Haveli, Pune",
    area_or_amount: "1.25 Hectare",
    issue_date: "14/08/2024",
    issuing_authority: "Revenue Department, Government of Maharashtra",
  },
  {
    holder_name: { confidence: 0.97 },
    document_number: { confidence: 0.91 },
    property_identifier: { confidence: 0.94 },
    location: { confidence: 0.88 },
    area_or_amount: { confidence: 0.86 },
    issue_date: { confidence: 0.95 },
    issuing_authority: { confidence: 0.9 },
    document_type: { confidence: 0.93 },
  },
)

export function extractFields(file: File): Promise<Result<ExtractedField[]>> {
  return withFallback(
    "extract",
    async () => {
      const sarvam = getClient()
      const job = await sarvam.docAi.extract({ file: [file], schema: extractionSchema, output_format: "json" }, REQUEST_OPTIONS)
      const deadline = Date.now() + 90_000
      let status = job.status
      while (!TERMINAL.has(status)) {
        if (Date.now() > deadline) throw new Error("Extraction timed out")
        await sleep(1500)
        status = (await sarvam.docAi.getStatus(job.job_id, REQUEST_OPTIONS)).status
      }
      if (status === "failed" || status === "rejected") throw new Error(`Extraction ${status}`)
      const raw = (await sarvam.docAi.getResults(job.job_id, { format: "json" }, REQUEST_OPTIONS)) as unknown as {
        result?: Record<string, unknown>
        annotations?: Record<string, { confidence?: unknown }>
      }
      const fields = toFields(raw.result ?? {}, raw.annotations)
      if (fields.length === 0) throw new Error("No fields extracted")
      return fields
    },
    () => MOCK_FIELDS.map((f) => ({ ...f })),
  )
}

/* ---------- Speech to text (Saaras v3) ---------- */

export function transcribe(audio: File, language: LanguageCode): Promise<Result<string>> {
  return withFallback(
    "transcribe",
    async () => {
      const res = await getClient().speechToText.transcribe(
        { file: audio, model: "saaras:v3", language_code: language },
        REQUEST_OPTIONS,
      )
      const text = res.transcript?.trim()
      if (!text) throw new Error("Empty transcript")
      return text
    },
    () => "Main Ramesh Shankar Patil hoon. Yeh zameen survey number 142/3B, Wadgaon gaon mein meri hai, aur iska kshetra 1.25 hectare hai.",
  )
}

/* ---------- Reasoning (Sarvam-105B) ---------- */

function parseJson<T>(content: string | null | undefined): T {
  if (!content) throw new Error("Empty model response")
  const cleaned = content.replace(/```(?:json)?/gi, "")
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start === -1 || end <= start) throw new Error("No JSON object in model response")
  return JSON.parse(cleaned.slice(start, end + 1)) as T
}

async function chatJson<T>(system: string, user: string): Promise<T> {
  const res = await getClient().chat.completions(
    {
      model: "sarvam-105b",
      temperature: 0,
      max_tokens: 2000,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: `${system}\nRespond with a single JSON object only. No prose, no markdown.` },
        { role: "user", content: user },
      ],
    },
    REQUEST_OPTIONS,
  )
  return parseJson<T>(res.choices?.[0]?.message?.content)
}

const fieldsAsText = (fields: ExtractedField[]) => fields.map((f) => `${f.key}: ${f.value}`).join("\n")

export function compareClaim(transcript: string, fields: ExtractedField[]): Promise<Result<Comparison>> {
  return withFallback(
    "compare",
    async () => {
      const out = await chatJson<Partial<Comparison>>(
        "You verify spoken claims against fields extracted from an official Indian document. The transcript may be in any Indian language or mixed with English; transliterate names and numbers before comparing. Only count a field as matched if the speaker actually stated it.",
        `Document fields:\n${fieldsAsText(fields)}\n\nSpoken attestation:\n"${transcript}"\n\nReturn {"match": boolean, "matched_fields": string[] (field keys), "mismatches": [{"field": key, "said": string, "found": string}], "summary": one English sentence}.`,
      )
      return {
        match: Boolean(out.match),
        matched_fields: Array.isArray(out.matched_fields) ? out.matched_fields.map(String) : [],
        mismatches: Array.isArray(out.mismatches)
          ? out.mismatches.map((m) => ({ field: String(m.field ?? ""), said: String(m.said ?? ""), found: String(m.found ?? "") }))
          : [],
        summary: String(out.summary ?? ""),
      }
    },
    () => ({
      match: true,
      matched_fields: fields.filter((f) => ["holder_name", "property_identifier", "location", "area_or_amount"].includes(f.key)).map((f) => f.key),
      mismatches: [],
      summary: "The speaker's name, survey number, village and land area all match the document.",
    }),
  )
}

export function sanityCheck(fields: ExtractedField[]): Promise<Result<SanityCheck>> {
  return withFallback(
    "sanity",
    async () => {
      const out = await chatJson<Partial<SanityCheck>>(
        "You are a document examiner for Indian government records. Look for internal inconsistencies: impossible or future dates, malformed record numbers, mismatched authority for the document type, implausible areas or amounts. Do not flag a field merely for being missing.",
        `Fields:\n${fieldsAsText(fields)}\n\nToday is ${new Date().toISOString().slice(0, 10)}. Return {"doc_type": short name, "red_flags": string[] (empty if none)}.`,
      )
      return {
        doc_type: String(out.doc_type ?? "Document"),
        red_flags: Array.isArray(out.red_flags) ? out.red_flags.map(String).slice(0, 5) : [],
      }
    },
    () => ({ doc_type: fields.find((f) => f.key === "document_type")?.value ?? "Document", red_flags: [] }),
  )
}

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  "hi-IN": "Hindi",
  "mr-IN": "Marathi",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
  "bn-IN": "Bengali",
  "en-IN": "English",
}

export function summarize(fields: ExtractedField[], language: LanguageCode): Promise<Result<string>> {
  return withFallback(
    "summarize",
    async () => {
      const out = await chatJson<{ summary?: string }>(
        `Write a plain, friendly two-sentence summary of a verified document for a citizen, in ${LANGUAGE_NAMES[language]} using its native script. Mention who it belongs to and what it certifies.`,
        `Fields:\n${fieldsAsText(fields)}\n\nReturn {"summary": string}.`,
      )
      if (!out.summary) throw new Error("Missing summary")
      return out.summary
    },
    () => {
      const name = fields.find((f) => f.key === "holder_name")?.value ?? "the holder"
      const type = fields.find((f) => f.key === "document_type")?.value ?? "document"
      return language === "hi-IN"
        ? `यह ${type} ${name} के नाम पर है। दस्तावेज़ का विवरण सत्यापित किया गया है।`
        : `This ${type} is registered to ${name}. Its details have been checked and sealed.`
    },
  )
}

/* ---------- Text to speech (Bulbul v3) ---------- */

export async function speak(text: string, language: LanguageCode): Promise<string | null> {
  if (MOCK_MODE) return null
  try {
    const res = await getClient().textToSpeech.convert(
      { text: text.slice(0, 1500), language_code: language, model: "bulbul:v3", speaker: "priya" },
      REQUEST_OPTIONS,
    )
    return res.audios?.[0] ?? null
  } catch (error) {
    console.error("[pramaan] tts failed:", error instanceof Error ? error.message : error)
    return null
  }
}
