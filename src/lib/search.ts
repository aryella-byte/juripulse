/**
 * Chinese fuzzy search utility.
 * Supports character-level matching for CJK text.
 */

export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  const t = text.toLowerCase()
  const q = query.toLowerCase()

  // Exact substring match
  if (t.includes(q)) return true

  // Character-level fuzzy match (all query chars appear in order)
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length
}

export function highlightMatch(text: string, query: string): { text: string; match: boolean }[] {
  if (!query) return [{ text, match: false }]

  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return [{ text, match: false }]

  return [
    { text: text.slice(0, idx), match: false },
    { text: text.slice(idx, idx + query.length), match: true },
    { text: text.slice(idx + query.length), match: false },
  ].filter(s => s.text.length > 0)
}
