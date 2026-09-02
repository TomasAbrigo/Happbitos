import { Award, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Achievement } from "@/lib/achievements/achievements";

export function AchievementsWidget({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="text-muted-foreground size-4" />
          <CardTitle className="text-base">Logros</CardTitle>
        </div>
        <span className="text-muted-foreground text-xs font-medium">
          {unlockedCount}/{achievements.length}
        </span>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {achievements.map((achievement) => (
            <li
              key={achievement.id}
              className={`flex items-start gap-2 ${achievement.unlocked ? "" : "opacity-40"}`}
            >
              {achievement.unlocked ? (
                <Award className="text-accent-foreground bg-accent mt-0.5 size-4 shrink-0 rounded-full p-0.5" />
              ) : (
                <Lock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm leading-tight font-semibold">
                  {achievement.label}
                </p>
                <p className="text-muted-foreground text-xs leading-tight">
                  {achievement.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
