import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import { sha256Text } from "./merkle"
import type { LedgerEntry } from "./types"

const GENESIS = "0".repeat(64)

// Vercel functions only allow writes to /tmp; locally the ledger lives in data/.
const LEDGER_PATH = process.env.VERCEL
  ? "/tmp/pramaan-ledger.json"
  : path.join(process.cwd(), "data", "ledger.json")

let writeQueue: Promise<unknown> = Promise.resolve()

async function readLedger(): Promise<LedgerEntry[]> {
  try {
    const raw = await fs.readFile(LEDGER_PATH, "utf8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function hashableEntry(entry: Omit<LedgerEntry, "entry_hash">) {
  const { id, index, timestamp, prev_hash, root, leaves, metadata } = entry
  return JSON.stringify({ id, index, timestamp, prev_hash, root, leaves, metadata })
}

export async function computeEntryHash(entry: Omit<LedgerEntry, "entry_hash">) {
  return sha256Text(hashableEntry(entry) + entry.prev_hash)
}

export function appendEntry(input: Pick<LedgerEntry, "root" | "leaves" | "metadata">): Promise<LedgerEntry> {
  const task = writeQueue.then(async () => {
    const ledger = await readLedger()
    const prev = ledger[ledger.length - 1]
    const base = {
      id: `PRM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      index: ledger.length,
      timestamp: new Date().toISOString(),
      prev_hash: prev?.entry_hash ?? GENESIS,
      ...input,
    }
    const entry: LedgerEntry = { ...base, entry_hash: await computeEntryHash(base) }
    await fs.mkdir(path.dirname(LEDGER_PATH), { recursive: true })
    await fs.writeFile(LEDGER_PATH, JSON.stringify([...ledger, entry], null, 2))
    return entry
  })
  writeQueue = task.catch(() => undefined)
  return task
}

export type ChainCheck = { entry: LedgerEntry; chainValid: boolean; brokenAt: number | null; length: number }

export async function findEntry(id: string): Promise<ChainCheck | null> {
  const ledger = await readLedger()
  const entry = ledger.find((e) => e.id === id)
  if (!entry) return null

  let brokenAt: number | null = null
  for (let i = 0; i <= entry.index && i < ledger.length; i++) {
    const current = ledger[i]
    const expectedPrev = i === 0 ? GENESIS : ledger[i - 1].entry_hash
    const { entry_hash, ...rest } = current
    if (current.prev_hash !== expectedPrev || (await computeEntryHash(rest)) !== entry_hash) {
      brokenAt = i
      break
    }
  }
  return { entry, chainValid: brokenAt === null, brokenAt, length: ledger.length }
}
