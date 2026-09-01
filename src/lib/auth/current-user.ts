import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE_NAME } from "./constants";
import { verifySessionToken } from "./session";

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token, process.env.AUTH_SECRET!);
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, username: true },
  });

  return user ?? null;
});
