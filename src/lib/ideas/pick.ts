const COOLDOWN_DAYS = 4;

export function pickIdea<T extends { id: string }>(
  ideas: T[],
  lastPickedAt: Map<string, Date>,
  excludeIds: Set<string> = new Set(),
  now: Date = new Date(),
): T | null {
  if (ideas.length === 0) return null;

  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - COOLDOWN_DAYS);

  const notExcluded = ideas.filter((idea) => !excludeIds.has(idea.id));
  const pool = notExcluded.length > 0 ? notExcluded : ideas;

  const offCooldown = pool.filter((idea) => {
    const last = lastPickedAt.get(idea.id);
    return !last || last < cutoff;
  });

  const finalPool = offCooldown.length > 0 ? offCooldown : pool;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
