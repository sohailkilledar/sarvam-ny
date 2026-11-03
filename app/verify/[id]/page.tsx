import type { Metadata } from "next"
import { CheckCircle2, XCircle } from "lucide-react"
import { SiteHeader } from "@/components/pramaan/site-header"
import { FileCheck } from "@/components/pramaan/file-check"
import { findEntry } from "@/lib/ledger"
import { merkleRoot } from "@/lib/merkle"
import { LANGUAGES } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `Verify ${id} — Pramaan` }
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
      )}
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </li>
  )
}

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const check = await findEntry(id)

  if (!check) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <XCircle className="mx-auto size-10 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">Certificate not found</h1>
          <p className="mt-2 text-muted-foreground">
            {`No certificate with ID ${id} exists in this ledger. It may be fake, or the demo ledger was reset.`}
          </p>
        </main>
      </div>
    )
  }

  const { entry, chainValid, brokenAt } = check
  const rootValid = (await merkleRoot(entry.leaves.map((l) => l.hash))) === entry.root
  const authentic = chainValid && rootValid
  const languageName = LANGUAGES.find((l) => l.code === entry.metadata.language)?.label ?? entry.metadata.language

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <section
          className={`rounded-lg border-2 p-6 ${authentic ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}
        >
          <p className="font-mono text-sm text-muted-foreground">{entry.id}</p>
          <h1 className={`mt-1 text-2xl font-semibold ${authentic ? "text-primary" : "text-destructive"}`}>
            {authentic ? "Authentic, untampered certificate" : "Certificate integrity check failed"}
          </h1>
          <p className="mt-2 text-pretty leading-relaxed">{entry.metadata.summary}</p>
        </section>

        <section className="grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Document</p>
            <p className="font-medium">{entry.metadata.doc_type}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Trust score</p>
            <p className="font-medium tabular-nums">
              {entry.metadata.trust_score}/100 · {entry.metadata.trust_label}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sealed</p>
            <p className="font-medium">{new Date(entry.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Integrity checks</h2>
          <ul className="flex flex-col gap-4">
            <Check
              ok={rootValid}
              label="Merkle root recomputes"
              detail={`${entry.leaves.length} sealed leaves (image, fields, transcript, audio) hash to the stored root.`}
            />
            <Check
              ok={chainValid}
              label="Ledger hash chain intact"
              detail={chainValid ? `All blocks up to #${entry.index} link correctly.` : `Chain breaks at block #${brokenAt}.`}
            />
            <Check
              ok={entry.metadata.voice_match}
              label={`Voice attestation (${languageName})`}
              detail={entry.metadata.voice_match ? "Spoken claims matched the document." : "Spoken claims did not fully match."}
            />
            <Check
              ok={entry.metadata.edited_fields.length === 0}
              label="Fields unedited"
              detail={
                entry.metadata.edited_fields.length
                  ? `Manually corrected: ${entry.metadata.edited_fields.join(", ")}`
                  : "All fields sealed exactly as extracted."
              }
            />
          </ul>
        </section>

        <FileCheck leaves={entry.leaves} root={entry.root} />

        <details className="rounded-lg border bg-card p-6 text-sm">
          <summary className="cursor-pointer font-medium">Raw cryptographic record</summary>
          <dl className="mt-4 grid gap-2 font-mono text-xs">
            {[
              ["Merkle root", entry.root],
              ["Entry hash", entry.entry_hash],
              ["Previous hash", entry.prev_hash],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-all">{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      </main>
    </div>
  )
}
