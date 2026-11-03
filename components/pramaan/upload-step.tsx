"use client"

import { useRef, useState } from "react"
import { FileUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  busy: boolean
  status: string | null
  onFile: (file: File) => void
}

export function UploadStep({ busy, status, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  async function useSample() {
    const res = await fetch("/sample-land-record.png")
    const blob = await res.blob()
    onFile(new File([blob], "sample-land-record.png", { type: "image/png" }))
  }

  return (
    <div className="flex flex-col gap-4">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file && !busy) onFile(file)
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        {busy ? (
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <FileUp className="size-8 text-primary" aria-hidden="true" />
        )}
        <span className="font-medium">{busy ? status ?? "Reading document…" : "Drop a document image or click to upload"}</span>
        <span className="text-sm text-muted-foreground">Land records, deeds, certificates, ID cards · JPG, PNG or PDF up to 10 MB</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ""
          }}
        />
      </label>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>No document handy?</span>
        <Button variant="outline" size="sm" onClick={useSample} disabled={busy}>
          Use sample land record
        </Button>
      </div>
    </div>
  )
}
