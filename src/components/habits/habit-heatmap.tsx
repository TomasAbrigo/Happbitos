type DayStatus = "completed" | "missed" | "none";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

const statusClass: Record<DayStatus, string> = {
  completed: "bg-primary",
  missed: "bg-destructive/40",
  none: "bg-muted",
};

export function HabitHeatmap({
  completedDates,
  missedDates,
  weeks = 20,
  habitCreatedAt,
}: {
  completedDates: Set<string>;
  missedDates: Set<string>;
  weeks?: number;
  habitCreatedAt: string;
}) {
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  const startWeek = new Date(currentWeekStart);
  startWeek.setUTCDate(startWeek.getUTCDate() - (weeks - 1) * 7);

  const columns: Date[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startWeek);
    weekStart.setUTCDate(weekStart.getUTCDate() + i * 7);
    columns.push(weekStart);
  }

  function dayStatus(iso: string): DayStatus {
    if (iso < habitCreatedAt) return "none";
    if (completedDates.has(iso)) return "completed";
    if (missedDates.has(iso)) return "missed";
    return "none";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto">
        {columns.map((weekStart) => (
          <div key={toIsoDate(weekStart)} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const day = new Date(weekStart);
              day.setUTCDate(day.getUTCDate() + dayIndex);
              const iso = toIsoDate(day);
              const status = dayStatus(iso);

              return (
                <div
                  key={iso}
                  title={`${iso}: ${status === "completed" ? "cumplido" : status === "missed" ? "no cumplido" : "sin registro"}`}
                  className={`size-3 rounded-sm ${statusClass[status]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="bg-primary size-3 rounded-sm" /> Cumplido
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-destructive/40 size-3 rounded-sm" /> No cumplido
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-muted size-3 rounded-sm" /> Sin registro
        </span>
      </div>
    </div>
  );
}
