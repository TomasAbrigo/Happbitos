import { TrendingDown, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOtherUser } from "@/lib/auth/other-user";
import { getWeeklySummaryForUser } from "@/lib/habits/get-weekly-summary";
import { getTrendsForUser } from "@/lib/habits/get-trends";
import type { MonthComparison, WeekdayTrend } from "@/lib/habits/trends";
import type { HabitWeekSummary } from "@/lib/habits/weekly-summary";
import { getCompletionQuip } from "@/lib/habits/streak-flavor";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrimaryHeader } from "@/components/app-header";

function barColor(rate: number) {
  if (rate >= 0.7) return "bg-success";
  if (rate >= 0.4) return "bg-accent";
  return "bg-destructive";
}

function overallRate(items: HabitWeekSummary[]) {
  if (items.length === 0) return 0;
  return (
    items.reduce((sum, item) => sum + item.completionRate, 0) / items.length
  );
}

function currentWeekRange(): { start: Date; end: Date } {
  const date = new Date();
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() + diffToMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { start, end };
}

function formatWeekRange({ start, end }: { start: Date; end: Date }) {
  const day = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    timeZone: "UTC",
  });
  const month = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: "UTC",
  });
  return `Semana del ${day.format(start)} al ${day.format(end)} de ${month.format(end)}`;
}

function SummaryCard({
  username,
  items,
  tone,
}: {
  username: string;
  items: HabitWeekSummary[];
  tone: "me" | "friend";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback
              className={
                tone === "me"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground"
              }
            >
              {username.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-heading text-base font-bold">{username}</span>
        </div>
        <Badge variant="secondary">
          {Math.round(overallRate(items) * 100)}% la semana
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Sin hábitos activos por acá.
          </p>
        )}
        {items.map((item) => (
          <div key={item.habitId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{item.name}</span>
              <span className="text-muted-foreground text-xs">
                {item.currentStreak} sem · máx {item.maxStreak}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {getCompletionQuip(item.completionRate)}
              </span>
              <span className="text-sm font-semibold">
                {Math.round(item.completionRate * 100)}%
              </span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${barColor(item.completionRate)}`}
                style={{ width: `${Math.round(item.completionRate * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TrendsCard({
  bestWeekday,
  monthComparison,
}: {
  bestWeekday: WeekdayTrend | null;
  monthComparison: MonthComparison;
}) {
  const hasMonthData = monthComparison.lastMonthSample > 0;
  const improving = monthComparison.delta >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tendencias</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Tu mejor día</span>
          {bestWeekday ? (
            <span className="text-sm font-semibold">
              {bestWeekday.label} · {Math.round(bestWeekday.rate * 100)}% de
              cumplimiento
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">
              Todavía no hay suficientes datos para saberlo.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">
            Este mes vs. el anterior
          </span>
          {hasMonthData ? (
            <span
              className={`flex items-center gap-1.5 text-sm font-semibold ${improving ? "text-success" : "text-destructive"}`}
            >
              {improving ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
              {Math.round(monthComparison.thisMonthRate * 100)}% vs.{" "}
              {Math.round(monthComparison.lastMonthRate * 100)}% el mes pasado
            </span>
          ) : (
            <span className="text-sm font-semibold">
              {Math.round(monthComparison.thisMonthRate * 100)}% este mes ·
              sin datos del mes pasado para comparar
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function SummaryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const friend = await getOtherUser(user.id);

  const [mySummary, friendSummary, trends] = await Promise.all([
    getWeeklySummaryForUser(user.id),
    friend ? getWeeklySummaryForUser(friend.id) : Promise.resolve([]),
    getTrendsForUser(user.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center">
      <PrimaryHeader username={user.username} />

      <div className="flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl font-bold">
              Resumen semanal
            </h1>
            <p className="text-muted-foreground text-sm">
              Los dos, en la misma pantalla. Nadie se escapa.
            </p>
          </div>
          <Badge variant="secondary">
            {formatWeekRange(currentWeekRange())}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SummaryCard username={user.username} items={mySummary} tone="me" />
          {friend && (
            <SummaryCard
              username={friend.username}
              items={friendSummary}
              tone="friend"
            />
          )}
        </div>

        <TrendsCard
          bestWeekday={trends.bestWeekday}
          monthComparison={trends.monthComparison}
        />
      </div>
    </div>
  );
}
