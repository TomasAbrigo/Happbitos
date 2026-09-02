import { Flame } from "lucide-react";
import { getStreakQuip } from "@/lib/habits/streak-flavor";

function currentPillTone(current: number) {
  if (current === 0) return "bg-muted text-muted-foreground";
  if (current < 4) return "bg-accent text-accent-foreground";
  return "bg-primary text-primary-foreground";
}

export function StreakPills({
  current,
  max,
  showQuip = true,
}: {
  current: number;
  max: number;
  showQuip?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${currentPillTone(current)}`}
      >
        <Flame
          className={`size-3.5 ${current > 0 ? "" : "opacity-40"}`}
          strokeWidth={2.5}
        />
        Racha actual · {current} sem.
      </span>
      <span className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs font-medium">
        Máx: {max} sem.
      </span>
      {showQuip && (
        <span className="text-muted-foreground text-xs italic">
          {getStreakQuip(current)}
        </span>
      )}
    </div>
  );
}
