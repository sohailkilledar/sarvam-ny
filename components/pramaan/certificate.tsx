"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import QRCode from "qrcode"
import { Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LedgerEntry } from "@/lib/types"

export function Certificate({ entry }: { entry: LedgerEntry }) {
  const [qr, setQr] = useState<string | null>(null)
  const [verifyUrl, setVerifyUrl] = useState("")

  // QR generation is local computation from window.location, not a data fetch.
  useEffect(() => {
    const url = `${window.location.origin}/verify/${entry.id}`
    setVerifyUrl(url)
    QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: "#1e2a3a", light: "#ffffff" } }).then(setQr)
  }, [entry.id])

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF({ unit: "pt", format: "a4" })
    const x = 56
    doc.setFont("helvetica", "bold").setFontSize(22).text("Pramaan Certificate", x, 80)
    doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(90)
    doc.text("Voice-attested, tamper-evident document verification", x, 100)
    doc.setTextColor(20).setFontSize(12)
    const rows: [string, string][] = [
      ["Certificate ID", entry.id],
      ["Document type", entry.metadata.doc_type],
      ["Trust score", `${entry.metadata.trust_score}/100 (${entry.metadata.trust_label})`],
      ["Voice claims matched", entry.metadata.voice_match ? "Yes" : "Partially / No"],
      ["Sealed at", new Date(entry.timestamp).toUTCString()],
      ["Ledger index", String(entry.index)],
    ]
    rows.forEach(([k, v], i) => {
      doc.setFont("helvetica", "bold").text(k, x, 150 + i * 22)
      doc.setFont("helvetica", "normal").text(v, x + 160, 150 + i * 22)
    })
    doc.setFont("courier", "normal").setFontSize(8)
    doc.text(`Merkle root: ${entry.root}`, x, 300)
    doc.text(`Entry hash:  ${entry.entry_hash}`, x, 314)
    doc.text(`Prev hash:   ${entry.prev_hash}`, x, 328)
    if (qr) doc.addImage(qr, "PNG", x, 360, 160, 160)
    doc.setFont("helvetica", "normal").setFontSize(10).text("Scan to verify, or visit:", x + 180, 390)
    doc.setTextColor(30, 90, 70).text(verifyUrl, x + 180, 406, { maxWidth: 300 })
    doc.save(`pramaan-${entry.id}.pdf`)
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border-2 border-primary/30 bg-card p-6 md:flex-row md:items-center">
      <div className="flex size-44 shrink-0 items-center justify-center rounded-md border bg-white p-2">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated data URL
          <img src={qr} alt={`QR code linking to verification page for ${entry.id}`} className="size-full" />
        ) : (
          <div className="size-full animate-pulse rounded bg-muted" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Sealed certificate</p>
          <p className="font-mono text-2xl font-semibold">{entry.id}</p>
        </div>
        <dl className="grid gap-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Merkle root</dt>
            <dd className="truncate font-mono">{entry.root}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Ledger block</dt>
            <dd className="font-mono">#{entry.index}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadPdf}>
            <Download aria-hidden="true" />
            Download PDF
          </Button>
          <Link
            href={`/verify/${entry.id}`}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open verifier
          </Link>
        </div>
      </div>
    </div>
  )
}
