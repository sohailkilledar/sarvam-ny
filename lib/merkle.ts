// Works in both the browser and Node (globalThis.crypto.subtle).

export function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function sha256Bytes(data: ArrayBuffer | Uint8Array): Promise<string> {
  const view = data instanceof Uint8Array ? data : new Uint8Array(data)
  return toHex(await crypto.subtle.digest("SHA-256", view as BufferSource))
}

export async function sha256Text(text: string): Promise<string> {
  return sha256Bytes(new TextEncoder().encode(text))
}

// Domain-separated prefixes prevent a leaf hash being replayed as an internal node.
export const leafHash = (content: string) => sha256Text(`leaf:${content}`)
const nodeHash = (left: string, right: string) => sha256Text(`node:${left}${right}`)

export async function buildLevels(leaves: string[]): Promise<string[][]> {
  if (leaves.length === 0) throw new Error("Merkle tree needs at least one leaf")
  const levels: string[][] = [leaves]
  while (levels[levels.length - 1].length > 1) {
    const current = levels[levels.length - 1]
    const next: string[] = []
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i]
      const right = current[i + 1] ?? left
      next.push(await nodeHash(left, right))
    }
    levels.push(next)
  }
  return levels
}

export async function merkleRoot(leaves: string[]): Promise<string> {
  const levels = await buildLevels(leaves)
  return levels[levels.length - 1][0]
}

export type ProofStep = { sibling: string; position: "left" | "right" }

export async function merkleProof(leaves: string[], index: number): Promise<ProofStep[]> {
  const levels = await buildLevels(leaves)
  const proof: ProofStep[] = []
  let i = index
  for (let level = 0; level < levels.length - 1; level++) {
    const nodes = levels[level]
    const isRight = i % 2 === 1
    const siblingIndex = isRight ? i - 1 : i + 1
    proof.push({ sibling: nodes[siblingIndex] ?? nodes[i], position: isRight ? "left" : "right" })
    i = Math.floor(i / 2)
  }
  return proof
}

export async function verifyProof(leaf: string, proof: ProofStep[], root: string): Promise<boolean> {
  let hash = leaf
  for (const step of proof) {
    hash = step.position === "left" ? await nodeHash(step.sibling, hash) : await nodeHash(hash, step.sibling)
  }
  return hash === root
}
