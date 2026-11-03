import Link from "next/link"
import { ArrowRight, CheckCircle2, FileSearch, Fingerprint, Mic2, ScanLine, ShieldCheck } from "lucide-react"
import { SiteHeader } from "@/components/pramaan/site-header"

const steps = [
  { icon: FileSearch, title: "Read", description: "Sarvam AI extracts the visible content and key fields from your document." },
  { icon: Mic2, title: "Confirm", description: "You review the extracted fields and attest that they match what you see." },
  { icon: Fingerprint, title: "Seal", description: "A tamper-evident record is created from the document and your attestation." },
  { icon: ScanLine, title: "Verify", description: "Anyone can scan the certificate QR code and check the record." },
]

const faqs = [
  ["What does Pramaan verify?", "Pramaan verifies that a specific document file and its attested contents match the record that was sealed. It does not decide whether a government or institution originally issued the document."],
  ["Is my document stored?", "The verification flow uses the uploaded file to extract and seal the result. Review your deployment's storage and retention settings before using sensitive documents in production."],
  ["Why do I need to speak?", "Voice attestation adds a clear human confirmation step in your language. You can review every extracted field before submitting it."],
]

export default function InfoPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        <section className="grid gap-8 border-b pb-14 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.24em] text-primary">Project brief · Pramaan</p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">Proof that stays understandable.</h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">Pramaan turns a document, a human confirmation, and a cryptographic seal into a verification record that is simple to share and easy to inspect.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">Start verifying <ArrowRight className="size-4" aria-hidden="true" /></Link>
              <a href="#process" className="rounded-md border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted">Explore the process</a>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-8 flex items-center justify-between"><ShieldCheck className="size-7 text-primary" aria-hidden="true" /><span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">TRUST LAYER</span></div>
            <p className="text-2xl font-medium tracking-tight">Readable by people.<br />Verifiable by machines.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Every step keeps the original context visible instead of hiding the result behind a black-box score.</p>
          </div>
        </section>

        <section id="process" className="py-14">
          <div className="mb-8 max-w-xl"><p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">The workflow</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Four deliberate checks</h2><p className="mt-3 text-muted-foreground">The interface guides you from upload to a shareable certificate without skipping the human review step.</p></div>
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map(({ icon: Icon, title, description }, index) => <article key={title} className="group rounded-xl border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"><div className="flex items-center justify-between"><Icon className="size-5 text-primary" aria-hidden="true" /><span className="font-mono text-xs text-muted-foreground">0{index + 1}</span></div><h3 className="mt-10 font-medium">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></article>)}
          </div>
        </section>

        <section className="grid gap-8 border-t py-14 md:grid-cols-[0.8fr_1.2fr]">
          <div><p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Design principles</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Built for confidence, not confusion.</h2></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["No hidden scoring", "Review before sealing", "Tamper-evident records", "QR-ready sharing"].map((item) => <div key={item} className="flex items-center gap-3 rounded-lg border bg-card p-4 text-sm"><CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />{item}</div>)}
          </div>
        </section>

        <section className="border-t py-14"><p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Questions</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Know what the seal means.</h2><div className="mt-6 grid gap-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-lg border bg-card px-5 py-4"><summary className="cursor-pointer list-none font-medium marker:hidden">{question}<span className="float-right text-muted-foreground transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{answer}</p></details>)}</div></section>
      </main>
    </div>
  )
}
