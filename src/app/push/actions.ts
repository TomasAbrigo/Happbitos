"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { sendPushToUser } from "@/lib/push/send-push";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeToPush(subscription: PushSubscriptionInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

  return { error: null };
}

export async function unsubscribeFromPush(endpoint: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.userId, user.id),
      ),
    );
}

export async function isSubscribedToPush(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const existing = await db.query.pushSubscriptions.findFirst({
    where: eq(pushSubscriptions.userId, user.id),
    columns: { id: true },
  });
  return !!existing;
}

export async function sendTestPush() {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const result = await sendPushToUser(user.id, {
    title: "Happbitos",
    body: "Las notificaciones están andando. 🔥",
    url: "/",
  });
  if (result.sent === 0) {
    return { error: "No se pudo enviar (¿estás suscripto?)." };
  }
  return { error: null };
}
