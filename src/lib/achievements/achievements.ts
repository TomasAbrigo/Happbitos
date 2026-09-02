export type AchievementInput = {
  totalCompletedEntries: number;
  bestStreakEver: number;
  activeHabitCount: number;
  oldestActiveHabitDays: number;
  ideaPicksCount: number;
  reactionsCount: number;
};

export type Achievement = {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
};

export function computeAchievements(input: AchievementInput): Achievement[] {
  return [
    {
      id: "first-step",
      label: "Primer paso",
      description: "Marcá tu primer hábito cumplido",
      unlocked: input.totalCompletedEntries >= 1,
    },
    {
      id: "streak-4",
      label: "En racha",
      description: "Llegá a una racha de 4 semanas",
      unlocked: input.bestStreakEver >= 4,
    },
    {
      id: "streak-8",
      label: "Ya es costumbre",
      description: "Llegá a una racha de 8 semanas",
      unlocked: input.bestStreakEver >= 8,
    },
    {
      id: "streak-12",
      label: "Imparable",
      description: "Llegá a una racha de 12 semanas",
      unlocked: input.bestStreakEver >= 12,
    },
    {
      id: "streak-20",
      label: "Leyenda viva",
      description: "Llegá a una racha de 20 semanas",
      unlocked: input.bestStreakEver >= 20,
    },
    {
      id: "multitask",
      label: "Multitarea",
      description: "Tené 3 o más hábitos activos a la vez",
      unlocked: input.activeHabitCount >= 3,
    },
    {
      id: "veteran",
      label: "Veterano",
      description: "Un hábito activo hace más de 60 días",
      unlocked: input.oldestActiveHabitDays >= 60,
    },
    {
      id: "explorer",
      label: "Explorador",
      description: "Usá la sección ¿Aburrido? al menos una vez",
      unlocked: input.ideaPicksCount >= 1,
    },
    {
      id: "social",
      label: "Sociable",
      description: "Mandá o recibí una reacción",
      unlocked: input.reactionsCount >= 1,
    },
  ];
}
