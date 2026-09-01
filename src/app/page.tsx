import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { HabitList } from "@/components/habits/habit-list";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return null;

  const activeHabits = await db.query.habits.findMany({
    where: and(eq(habits.userId, user.id), eq(habits.status, "active")),
    orderBy: (h, { asc }) => [asc(h.createdAt)],
  });

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-md items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HAppbitos</h1>
          <p className="text-muted-foreground text-sm">Hola, {user.username}.</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Salir
          </Button>
        </form>
      </div>

      <HabitList habits={activeHabits} />
    </div>
  );
}
