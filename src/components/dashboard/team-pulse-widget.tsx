import { Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPulseQuip, type PulseSide } from "@/lib/habits/team-pulse";

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
}: {
  me: PulseSide;
  friend: PulseSide | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Swords className="text-muted-foreground size-4" />
        <CardTitle className="text-base">Cara a cara, hoy</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Bar side={me} tone="me" />
        {friend && <Bar side={friend} tone="friend" />}
        <p className="text-muted-foreground text-xs">
          {getPulseQuip(me, friend)}
        </p>
      </CardContent>
    </Card>
  );
}
