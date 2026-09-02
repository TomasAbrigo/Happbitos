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
  points: number;
};

const POINTS_PER_LEVEL = 50;

export function computeAchievements(input: AchievementInput): Achievement[] {
  return [
    {
      id: "first-step",
      label: "Primer paso",
      description: "Marcá tu primer hábito cumplido",
      unlocked: input.totalCompletedEntries >= 1,
      points: 10,
    },
    {
      id: "streak-4",
      label: "En racha",
      description: "Llegá a una racha de 4 semanas",
      unlocked: input.bestStreakEver >= 4,
      points: 20,
    },
    {
      id: "streak-8",
      label: "Ya es costumbre",
      description: "Llegá a una racha de 8 semanas",
      unlocked: input.bestStreakEver >= 8,
      points: 30,
    },
    {
      id: "streak-12",
      label: "Imparable",
      description: "Llegá a una racha de 12 semanas",
      unlocked: input.bestStreakEver >= 12,
      points: 40,
    },
    {
      id: "streak-20",
      label: "Leyenda viva",
      description: "Llegá a una racha de 20 semanas",
      unlocked: input.bestStreakEver >= 20,
      points: 50,
    },
    {
      id: "multitask",
      label: "Multitarea",
      description: "Tené 3 o más hábitos activos a la vez",
      unlocked: input.activeHabitCount >= 3,
      points: 15,
    },
    {
      id: "veteran",
      label: "Veterano",
      description: "Un hábito activo hace más de 60 días",
      unlocked: input.oldestActiveHabitDays >= 60,
      points: 20,
    },
    {
      id: "explorer",
      label: "Explorador",
      description: "Usá la sección ¿Aburrido? al menos una vez",
      unlocked: input.ideaPicksCount >= 1,
      points: 10,
    },
    {
      id: "social",
      label: "Sociable",
      description: "Mandá o recibí una reacción",
      unlocked: input.reactionsCount >= 1,
      points: 10,
    },
  ];
}

export function totalPoints(achievements: Achievement[]): number {
  return achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);
}

export function levelFor(points: number): number {
  return Math.floor(points / POINTS_PER_LEVEL) + 1;
}

export function pointsToNextLevel(points: number): number {
  const currentLevelFloor = (levelFor(points) - 1) * POINTS_PER_LEVEL;
  return currentLevelFloor + POINTS_PER_LEVEL - points;
}
