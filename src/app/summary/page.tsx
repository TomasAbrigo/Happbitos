import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOtherUser } from "@/lib/auth/other-user";
import { getWeeklySummaryForUser } from "@/lib/habits/get-weekly-summary";
import type { HabitWeekSummary } from "@/lib/habits/weekly-summary";
import { getCompletionQuip, getStreakFlavor } from "@/lib/habits/streak-flavor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SummaryList({ items }: { items: HabitWeekSummary[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Sin hábitos activos por acá.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Card key={item.habitId}>
          <CardHeader>
            <CardTitle className="text-sm">{item.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {getCompletionQuip(item.completionRate)} ·{" "}
              {Math.round(item.completionRate * 100)}%
            </Badge>
            <Badge>
              {getStreakFlavor(item.currentStreak)} · {item.currentStreak} sem.
            </Badge>
            <Badge variant="outline">Máx: {item.maxStreak} sem.</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function SummaryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const friend = await getOtherUser(user.id);

  const [mySummary, friendSummary] = await Promise.all([
    getWeeklySummaryForUser(user.id),
    friend ? getWeeklySummaryForUser(friend.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Link href="/" className="text-muted-foreground text-sm">
          ← Volver
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Resumen semanal
        </h1>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{user.username}</h2>
          <SummaryList items={mySummary} />
        </div>

        {friend && (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">{friend.username}</h2>
            <SummaryList items={friendSummary} />
          </div>
        )}
      </div>
    </div>
  );
}
