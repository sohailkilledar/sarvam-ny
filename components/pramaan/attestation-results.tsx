"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Volume2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TrustGauge } from "./trust-gauge"
import type { Comparison, ExtractedField, LanguageCode, SanityCheck, TrustBreakdown } from "@/lib/types"

export type AttestResult = {
  transcript: string
  comparison: Comparison
  sanity: SanityCheck
  summary: string
  trust: TrustBreakdown
  mock: boolean
}

type Props = { result: AttestResult; fields: ExtractedField[]; language: LanguageCode }

export function AttestationResults({ result, fields, language }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const labelOf = (key: string) => fields.find((f) => f.key === key)?.label ?? key

  async function listen() {
    setSpeaking(true)
    setTtsError(null)
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.summary, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const audio = new Audio(`data:audio/wav;base64,${data.audio}`)
      audio.onended = () => setSpeaking(false)
      await audio.play()
    } catch (e) {
      setTtsError(e instanceof Error ? e.message : "Playback failed")
      setSpeaking(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <section className="rounded-lg border bg-card p-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What you said</h3>
          <p className="mt-2 text-pretty leading-relaxed">{`"${result.transcript}"`}</p>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Claim check</h3>
          <p className="mt-2 text-sm leading-relaxed">{result.comparison.summary}</p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {result.comparison.matched_fields.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                {labelOf(key)} matched
              </li>
            ))}
            {result.comparison.mismatches.map((m) => (
              <li key={m.field} className="flex items-start gap-2">
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                <span>
                  {labelOf(m.field)}: said <strong>{m.said}</strong>, document shows <strong>{m.found}</strong>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {result.sanity.red_flags.length > 0 && (
          <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
            <h3 className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
              Red flags
            </h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {result.sanity.red_flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</h3>
            <Button variant="outline" size="sm" onClick={listen} disabled={speaking}>
              {speaking ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
              Listen
            </Button>
          </div>
          <p className="mt-2 text-pretty leading-relaxed">{result.summary}</p>
          {ttsError && <p className="mt-2 text-sm text-destructive">{ttsError}</p>}
        </section>
      </div>
      <TrustGauge trust={result.trust} />
    </div>
  )
}
