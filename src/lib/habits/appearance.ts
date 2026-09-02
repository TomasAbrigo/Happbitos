export const HABIT_ICONS = [
  "💧",
  "🏃",
  "📚",
  "🧘",
  "💪",
  "😴",
  "🥗",
  "🎨",
  "💰",
  "🚭",
  "☀️",
  "✍️",
] as const;

export const HABIT_COLORS = [
  { id: "chart-1", label: "Amarillo", className: "bg-chart-1" },
  { id: "chart-2", label: "Verde", className: "bg-chart-2" },
  { id: "chart-3", label: "Rojo", className: "bg-chart-3" },
  { id: "chart-4", label: "Gris", className: "bg-chart-4" },
  { id: "chart-5", label: "Oscuro", className: "bg-chart-5" },
] as const;

export function habitColorClass(color: string | null | undefined): string {
  const found = HABIT_COLORS.find((c) => c.id === color);
  return found ? found.className : "bg-muted";
}
