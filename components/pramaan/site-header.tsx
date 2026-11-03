import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="border-b bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          Pramaan
        </Link>
        <p className="text-sm text-muted-foreground">Powered by Sarvam AI</p>
      </div>
    </header>
  )
}
