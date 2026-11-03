import { SiteHeader } from "@/components/pramaan/site-header"
import { PramaanFlow } from "@/components/pramaan/pramaan-flow"
import { Noto_Sans_Devanagari } from "next/font/google"

const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: "500" })

export default function Page() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="relative mb-10 max-w-3xl overflow-hidden rounded-2xl border bg-card px-6 py-8 shadow-sm md:px-10 md:py-12">
          <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">
            <span lang="hi" className={`${devanagari.className} text-sm normal-case tracking-normal`}>
              प्रमाण
            </span>{" "}
            · Proof
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Verify a document with your own voice.
          </h1>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Upload a document, confirm what it says by speaking in your language, and get a tamper-evident certificate
            anyone can check by scanning a QR code.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-background/70 px-3 py-1.5">Real Sarvam AI extraction</span>
            <span className="rounded-full border bg-background/70 px-3 py-1.5">Voice attestation</span>
            <span className="rounded-full border bg-background/70 px-3 py-1.5">QR verification</span>
          </div>
        </section>
        <PramaanFlow />
      </main>
    </div>
  )
}
