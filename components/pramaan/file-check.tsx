"use client"

import { useState } from "react"
import { CheckCircle2, FileSearch, XCircle } from "lucide-react"
import { leafHash, merkleProof, sha256Bytes, verifyProof } from "@/lib/merkle"
import type { LeafRecord } from "@/lib/types"

export function FileCheck({ leaves, root }: { leaves: LeafRecord[]; root: string }) {
  const [state, setState] = useState<"idle" | "checking" | "match" | "mismatch">("idle")

  async function check(file: File) {
    setState("checking")
    const hashes = leaves.map((l) => l.hash)
    const index = leaves.findIndex((l) => l.label === "image")
    const candidate = await leafHash(`image:${await sha256Bytes(await file.arrayBuffer())}`)
    if (index === -1 || candidate !== hashes[index]) return setState("mismatch")
    const ok = await verifyProof(candidate, await merkleProof(hashes, index), root)
    setState(ok ? "match" : "mismatch")
  }

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="font-semibold">Check an original file</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Hashed in your browser — the file never leaves your device. A single changed pixel will fail.
      </p>
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-4 py-4 text-sm hover:border-primary/50">
        <FileSearch className="size-5 text-primary" aria-hidden="true" />
        {state === "checking" ? "Computing Merkle proof…" : "Choose the document file to compare"}
        <input
          type="file"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) check(file)
            e.target.value = ""
          }}
        />
      </label>
      <div aria-live="polite">
        {state === "match" && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Merkle proof valid — this is the exact file that was sealed.
          </p>
        )}
        {state === "mismatch" && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-destructive">
            <XCircle className="size-4" aria-hidden="true" />
            Does not match — this file differs from the sealed original.
          </p>
        )}
      </div>
    </section>
  )
}
