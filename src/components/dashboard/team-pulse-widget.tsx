import { Flame, Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPulseQuip, type PulseSide } from "@/lib/habits/team-pulse";
import type { TeamStreakResult } from "@/lib/habits/team-streak";

function Bar({ side, tone }: { side: PulseSide; tone: "me" | "friend" }) {
  const pct = side.total === 0 ? 0 : Math.round((side.done / side.total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{side.username}</span>
        <span className="text-muted-foreground">
          {side.done}/{side.total}
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${tone === "me" ? "bg-primary" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TeamPulseWidget({
  me,
  friend,
  teamStreak,
}: {
  me: PulseSide;
  friend: PulseSide | null;
  teamStreak?: TeamStreakResult;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Swords className="text-muted-foreground size-4" />
          <CardTitle className="text-base">Cara a cara, hoy</CardTitle>
        </div>
        {teamStreak && teamStreak.currentStreak > 0 && (
          <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
            <Flame className="size-3.5" />
            Equipo · {teamStreak.currentStreak}d
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Bar side={me} tone="me" />
        {friend && <Bar side={friend} tone="friend" />}
        <p className="text-muted-foreground text-xs">
          {getPulseQuip(me, friend)}
        </p>
        {teamStreak && (
          <p className="text-muted-foreground text-xs">
            Racha de equipo: {teamStreak.currentStreak} día
            {teamStreak.currentStreak === 1 ? "" : "s"} seguidos con el 100%
            de los dos · máx {teamStreak.maxStreak}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
