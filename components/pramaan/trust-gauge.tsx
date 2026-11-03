import type { TrustBreakdown } from "@/lib/types"

export function TrustGauge({ trust }: { trust: TrustBreakdown }) {
  const tone =
    trust.label === "High" ? "text-primary" : trust.label === "Medium" ? "text-accent-foreground" : "text-destructive"
  const bar = trust.label === "High" ? "bg-primary" : trust.label === "Medium" ? "bg-amber-500" : "bg-destructive"

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trust score</p>
          <p className={`text-5xl font-semibold tabular-nums ${tone}`}>
            {trust.score}
            <span className="text-lg text-muted-foreground">/100</span>
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${tone}`}>{trust.label}</span>
      </div>
      <ul className="mt-5 flex flex-col gap-3">
        {trust.parts.map((part) => (
          <li key={part.name}>
            <div className="flex justify-between text-sm">
              <span>{part.name}</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {part.earned}/{part.weight}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className={`h-full ${bar}`} style={{ width: `${(part.earned / part.weight) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{part.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
