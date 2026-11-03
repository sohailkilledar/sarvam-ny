"use client"

import { useState } from "react"
import { Loader2, Lock, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadStep } from "./upload-step"
import { FieldsReview } from "./fields-review"
import { VoiceStep } from "./voice-step"
import { AttestationResults, type AttestResult } from "./attestation-results"
import { Certificate } from "./certificate"
import { leafHash, merkleRoot, sha256Bytes } from "@/lib/merkle"
import type { ExtractedField, LanguageCode, LeafRecord, LedgerEntry } from "@/lib/types"

type Step = "upload" | "review" | "attest" | "result" | "sealed"

type ApiPayload = Record<string, any>

async function readApiResponse(response: Response): Promise<ApiPayload> {
  const body = await response.text()
  if (!body.trim()) throw new Error(`Request failed (${response.status}). The service returned an empty response.`)
  try {
    return JSON.parse(body) as ApiPayload
  } catch {
    throw new Error(`Request failed (${response.status}). The service returned an invalid response.`)
  }
}
const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "attest", label: "Attest" },
  { id: "result", label: "Score" },
  { id: "sealed", label: "Seal" },
]

export function PramaanFlow() {
  const [step, setStep] = useState<Step>("upload")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mock, setMock] = useState(false)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewIsPdf, setPreviewIsPdf] = useState(false)
  const [fileHash, setFileHash] = useState<string | null>(null)
  const [fields, setFields] = useState<ExtractedField[]>([])
  const [language, setLanguage] = useState<LanguageCode>("hi-IN")
  const [audioHash, setAudioHash] = useState<string | null>(null)
  const [result, setResult] = useState<AttestResult | null>(null)
  const [entry, setEntry] = useState<LedgerEntry | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setBusy(true)
    setStatus("Hashing document…")
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setFileHash(await sha256Bytes(await file.arrayBuffer()))
      setPreviewIsPdf(file.type === "application/pdf")
      setPreviewUrl(URL.createObjectURL(file))
      setStatus("Extracting fields with Sarvam Vision…")
      const form = new FormData()
      form.append("document", file)
      const res = await fetch("/api/extract", { method: "POST", body: form })
      const data = await readApiResponse(res)
      if (!res.ok) throw new Error(String(data.error ?? "Extraction failed"))
      setFields(data.fields)
      setMock((m) => m || data.mock)
      setStep("review")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
      setStatus(null)
    }
  }

  function editField(key: string, value: string) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, value, edited: value !== f.originalValue } : f)))
  }

  async function handleAudio(audio: File) {
    setError(null)
    setBusy(true)
    try {
      setAudioHash(await sha256Bytes(await audio.arrayBuffer()))
      const form = new FormData()
      form.append("audio", audio)
      form.append("language", language)
      form.append("fields", JSON.stringify(fields))
      const res = await fetch("/api/attest", { method: "POST", body: form })
      const data = await readApiResponse(res)
      if (!res.ok) throw new Error(String(data.error ?? "Attestation failed"))
      setResult(data as AttestResult)
      setMock((m) => m || Boolean(data.mock))
      setStep("result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  async function seal() {
    if (!result || !fileHash || !audioHash) return
    setError(null)
    setBusy(true)
    try {
      const leaves: LeafRecord[] = [
        { label: "image", hash: await leafHash(`image:${fileHash}`) },
        ...(await Promise.all(
          fields.map(async (f) => ({ label: `field:${f.key}`, hash: await leafHash(`field:${f.key}:${f.value}`) })),
        )),
        { label: "transcript", hash: await leafHash(`transcript:${result.transcript}`) },
        { label: "audio", hash: await leafHash(`audio:${audioHash}`) },
      ]
      const root = await merkleRoot(leaves.map((l) => l.hash))
      const res = await fetch("/api/seal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaves,
          root,
          metadata: {
            doc_type: result.sanity.doc_type,
            trust_score: result.trust.score,
            trust_label: result.trust.label,
            language,
            summary: result.summary,
            field_keys: fields.map((f) => f.key),
            edited_fields: fields.filter((f) => f.edited).map((f) => f.key),
            voice_match: result.comparison.match,
          },
        }),
      })
      const data = await readApiResponse(res)
      if (!res.ok) throw new Error(String(data.error ?? "Sealing failed"))
      setEntry(data.entry)
      setStep("sealed")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setStep("upload")
    setPreviewUrl(null)
    setPreviewIsPdf(false)
    setFileHash(null)
    setFields([])
    setAudioHash(null)
    setResult(null)
    setEntry(null)
    setError(null)
    setMock(false)
  }

  const currentIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <span
              aria-current={i === currentIndex ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-3 py-1 ${
                i === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : i < currentIndex
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="font-mono text-xs">{i + 1}</span>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" aria-hidden="true" />}
          </li>
        ))}
        {step !== "upload" && (
          <li className="ml-auto">
            <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
              <RotateCcw aria-hidden="true" />
              Start over
            </Button>
          </li>
        )}
      </ol>

      {mock && (
        <p className="rounded-md border border-amber-300 bg-accent px-3 py-2 text-sm text-accent-foreground" role="status">
          A Sarvam service was slow or unavailable, so part of this run used built-in demo data.
        </p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {step === "upload" && <UploadStep busy={busy} status={status} onFile={handleFile} />}

      {step === "review" && (
        <>
          <p className="text-sm text-muted-foreground">
            Check the extracted fields. Fix anything that looks wrong — edits are recorded and slightly lower the trust score.
          </p>
          <FieldsReview fields={fields} previewUrl={previewUrl} previewIsPdf={previewIsPdf} onChange={editField} />
          <Button size="lg" className="self-start" onClick={() => setStep("attest")}>
            Continue to voice attestation
          </Button>
        </>
      )}

      {step === "attest" && (
        <VoiceStep fields={fields} language={language} onLanguage={setLanguage} busy={busy} onSubmit={handleAudio} />
      )}

      {step === "result" && result && (
        <>
          <AttestationResults result={result} fields={fields} language={language} />
          <Button size="lg" className="self-start" onClick={seal} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Lock aria-hidden="true" />}
            Seal into tamper-evident ledger
          </Button>
        </>
      )}

      {step === "sealed" && entry && (
        <>
          <Certificate entry={entry} />
          {result && <AttestationResults result={result} fields={fields} language={language} />}
        </>
      )}
    </div>
  )
}
