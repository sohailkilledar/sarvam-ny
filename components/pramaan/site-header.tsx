import Link from "next/link"
import { Info, ShieldCheck } from "lucide-react"

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
        <nav aria-label="Primary navigation" className="flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Verify
          </Link>
          <Link href="/info" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Info className="size-4" aria-hidden="true" />
            How it works
          </Link>
        </nav>
      </div>
    </header>
  )
}
