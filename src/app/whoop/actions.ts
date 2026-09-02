"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { whoopConnections } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function disconnectWhoop() {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .delete(whoopConnections)
    .where(eq(whoopConnections.userId, user.id));

  revalidatePath("/");
}
