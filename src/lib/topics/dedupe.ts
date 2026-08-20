export function filterNewKeywords(candidates: string[], existingKeywords: string[]): string[] {
  const existing = new Set(existingKeywords.map((k) => k.trim().toLowerCase()))
  const seen = new Set<string>()
  return candidates.filter((c) => {
    const key = c.trim().toLowerCase()
    if (!key || existing.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
