import { SiteHeader } from "@/components/pramaan/site-header"
import { PramaanFlow } from "@/components/pramaan/pramaan-flow"
import { Noto_Sans_Devanagari } from "next/font/google"

const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: "500" })

export default function Page() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="mb-10 max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">
            <span lang="hi" className={`${devanagari.className} text-sm normal-case tracking-normal`}>
              प्रमाण
            </span>{" "}
            · Proof
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Verify a document with your own voice.
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Upload a document, confirm what it says by speaking in your language, and get a tamper-evident certificate
            anyone can check by scanning a QR code.
          </p>
        </section>
        <PramaanFlow />
      </main>
    </div>
  )
}
