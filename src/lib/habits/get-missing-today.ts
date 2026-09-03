import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";

export async function getMissingHabitsToday(userId: string, today: string) {
  const activeHabits = await db.query.habits.findMany({
    where: and(eq(habits.userId, userId), eq(habits.status, "active")),
  });
  if (activeHabits.length === 0) return [];

  const habitIds = activeHabits.map((h) => h.id);
  const doneToday = await db.query.habitEntries.findMany({
    where: and(
      inArray(habitEntries.habitId, habitIds),
      eq(habitEntries.date, today),
      eq(habitEntries.completed, true),
    ),
    columns: { habitId: true },
  });

  const doneHabitIds = new Set(doneToday.map((e) => e.habitId));
  return activeHabits.filter((h) => !doneHabitIds.has(h.id));
}
