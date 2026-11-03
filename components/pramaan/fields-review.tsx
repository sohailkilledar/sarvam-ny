"use client"

import type { ExtractedField } from "@/lib/types"

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const tone = pct >= 85 ? "bg-primary/10 text-primary" : pct >= 60 ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"
  return <span className={`rounded px-1.5 py-0.5 font-mono text-xs ${tone}`}>{pct}%</span>
}

type Props = {
  fields: ExtractedField[]
  previewUrl: string | null
  previewIsPdf: boolean
  onChange: (key: string, value: string) => void
}

export function FieldsReview({ fields, previewUrl, previewIsPdf, onChange }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {previewUrl && (
        <div className="overflow-hidden rounded-lg border bg-card">
          {previewIsPdf ? (
            <iframe src={previewUrl} title="Uploaded PDF preview" className="h-96 w-full bg-muted" />
          ) : (
            <img src={previewUrl} alt="Uploaded document" className="h-full max-h-96 w-full object-contain" />
          )}
        </div>
      )}
      <ul className="flex flex-col divide-y rounded-lg border bg-card">
        {fields.map((field) => (
          <li key={field.key} className="flex flex-col gap-1.5 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`field-${field.key}`} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {field.label}
              </label>
              <div className="flex items-center gap-2">
                {field.edited && <span className="text-xs text-accent-foreground">Edited</span>}
                <ConfidenceBadge value={field.confidence} />
              </div>
            </div>
            <input
              id={`field-${field.key}`}
              value={field.value}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
