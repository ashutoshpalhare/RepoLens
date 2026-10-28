/** Minimal fuzzy matcher used by Quick Open and the explorer filter. */

export type FuzzyResult = { score: number; indices: number[] } | null;

export function fuzzyMatch(query: string, target: string): FuzzyResult {
  if (!query) return { score: 0, indices: [] };
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (!t.includes(q[0]!)) return null;

  const indices: number[] = [];
  let score = 0;
  let ti = 0;
  let streak = 0;

  for (let qi = 0; qi < q.length; qi += 1) {
    const ch = q[qi]!;
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;

    if (found === ti) streak += 1;
    else streak = 1;
    score += 10 + streak * 4;

    const prev = found > 0 ? target[found - 1] : "";
    if (found === 0 || prev === "/" || prev === "." || prev === "-" || prev === "_" || prev === " ") {
      score += 12; // word boundary bonus
    }
    if (target[found] === ch) score += 2; // case-sensitive bonus

    indices.push(found);
    ti = found + 1;
  }

  // Prefer shorter targets and shallower paths.
  score -= target.length * 0.15;
  score -= (target.match(/\//g)?.length ?? 0) * 1.5;

  return { score: Math.max(0, Math.round(score)), indices };
}

export function rankFuzzy<T>(
  query: string,
  items: T[],
  keyOf: (item: T) => string,
  limit = 60,
): { item: T; score: number; indices: number[] }[] {
  return items
    .map((item) => {
      const key = keyOf(item);
      const res = fuzzyMatch(query, key);
      return res ? { item, score: res.score, indices: res.indices, key } : null;
    })
    .filter((v): v is { item: T; score: number; indices: number[]; key: string } => Boolean(v))
    .sort((a, b) => b.score - a.score || a.key.length - b.key.length)
    .slice(0, limit);
}

/** Split a label into matched / unmatched chunks for highlighting. */
export function markIndices(label: string, indices: number[]): { text: string; hit: boolean }[] {
  if (!indices.length) return [{ text: label, hit: false }];
  const set = new Set(indices);
  const out: { text: string; hit: boolean }[] = [];
  let buf = "";
  let hit = set.has(0);
  for (let i = 0; i < label.length; i += 1) {
    const isHit = set.has(i);
    if (isHit === hit) buf += label[i];
    else {
      out.push({ text: buf, hit });
      buf = label[i];
      hit = isHit;
    }
  }
  if (buf) out.push({ text: buf, hit });
  return out;
}
