import { ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function getOtherUser(currentUserId: string) {
  return db.query.users.findFirst({
    where: ne(users.id, currentUserId),
    columns: { id: true, username: true },
  });
}
