export function getCompletionQuip(rate: number): string {
  if (rate >= 1) return "Semana perfecta";
  if (rate >= 0.5) return "Zafó";
  if (rate > 0) return "A los ponchazos";
  return "Semana en blanco";
}

const MISS_QUIPS = [
  "Faltaste sin aviso",
  "Cero registro",
  "Día libre, dijiste",
  "Se te pasó",
];

export function getMissedDayQuip(date: string): string {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  return MISS_QUIPS[hash % MISS_QUIPS.length];
}

export function getStreakQuip(currentStreak: number): string {
  if (currentStreak === 0) return "Arrancala hoy";
  if (currentStreak === 1) return "Primer paso dado";
  if (currentStreak < 4) return "Agarrando ritmo";
  if (currentStreak < 8) return "En racha";
  if (currentStreak < 12) return "Ya es costumbre";
  if (currentStreak < 20) return "Imparable";
  return "Leyenda viva";
}

export function getTodayProgressQuip(done: number, total: number): string {
  if (total === 0) return "Sumá tu primer hábito y arrancamos";
  if (done === 0) return "Todavía nada marcado hoy";
  if (done === total) return "Día limpio: todo marcado";
  return "Vas por la mitad, no aflojes";
}
