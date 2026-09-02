import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitEntries, habits, pushSubscriptions } from "@/db/schema";
import { todayIso } from "@/lib/date";
import { sendPushToUser } from "@/lib/push/send-push";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayIso();

  const subscribedUserIds = await db
    .selectDistinct({ userId: pushSubscriptions.userId })
    .from(pushSubscriptions);

  let notified = 0;

  for (const { userId } of subscribedUserIds) {
    const activeHabits = await db.query.habits.findMany({
      where: and(eq(habits.userId, userId), eq(habits.status, "active")),
    });
    if (activeHabits.length === 0) continue;

    const habitIds = activeHabits.map((h) => h.id);
    const doneToday = await db.query.habitEntries.findMany({
      where: and(
        inArray(habitEntries.habitId, habitIds),
        eq(habitEntries.date, today),
        eq(habitEntries.completed, true),
      ),
    });

    if (doneToday.length >= activeHabits.length) continue;

    const missing = activeHabits.length - doneToday.length;
    const result = await sendPushToUser(userId, {
      title: "Happbitos",
      body: `Te quedan ${missing} hábito${missing === 1 ? "" : "s"} sin marcar hoy. A tiempo estás.`,
      url: "/",
    });
    if (result.sent > 0) notified++;
  }

  return NextResponse.json({ ok: true, notified });
}
