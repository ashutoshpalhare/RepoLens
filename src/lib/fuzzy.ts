/** Tiny fuzzy score for path quick-open. Higher is better; 0 = no match. */
export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();
  if (!q) return 1;
  if (t === q) return 10_000;
  if (t.includes(q)) return 5_000 - t.indexOf(q);

  let ti = 0;
  let score = 0;
  let streak = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi]!;
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;
    streak = found === ti ? streak + 1 : 1;
    score += 10 + streak * 5;
    if (found === 0 || t[found - 1] === "/" || t[found - 1] === "." || t[found - 1] === "-" || t[found - 1] === "_") {
      score += 20;
    }
    ti = found + 1;
  }
  score -= t.length;
  return score;
}

export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  limit = 50,
): T[] {
  const q = query.trim();
  if (!q) return items.slice(0, limit);
  return items
    .map((item) => ({ item, score: fuzzyScore(q, getText(item)) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || 
