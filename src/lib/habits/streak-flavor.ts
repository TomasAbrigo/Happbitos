export function getCompletionQuip(rate: number): string {
  if (rate >= 1) return "Semana perfecta";
  if (rate >= 0.5) return "Zafó";
  if (rate > 0) return "A los ponchazos";
  return "Semana en blanco";
}

export function getStreakFlavor(weeks: number): string {
  if (weeks === 0) return "Arranque en frío";
  if (weeks === 1) return "Recién prendiste el motor";
  if (weeks <= 3) return "Agarrando ritmo";
  if (weeks <= 6) return "En racha de verdad";
  if (weeks <= 10) return "Modo imparable";
  return "Leyenda viviente";
}
