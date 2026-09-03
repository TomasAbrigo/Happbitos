import { NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { todayIso } from "@/lib/date";
import { getMissingHabitsToday } from "@/lib/habits/get-missing-today";
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
    const missingHabits = await getMissingHabitsToday(userId, today);
    if (missingHabits.length === 0) continue;

    const result = await sendPushToUser(userId, {
      title: "Happbitos",
      body: `Buen día ☀️. Hoy tenés ${missingHabits.length} hábito${missingHabits.length === 1 ? "" : "s"} esperando.`,
      url: "/",
    });
    if (result.sent > 0) notified++;
  }

  return NextResponse.json({ ok: true, notified });
}
