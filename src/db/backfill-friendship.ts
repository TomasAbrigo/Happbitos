import { and, eq, or } from "drizzle-orm";
import { db } from "./index";
import { friendships, users } from "./schema";

async function main() {
  const [usernameA, usernameB] = process.argv.slice(2);

  if (!usernameA || !usernameB) {
    console.error(
      "Usage: npm run db:backfill-friendship -- <usernameA> <usernameB>",
    );
    process.exit(1);
  }

  const [userA, userB] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.username, usernameA) }),
    db.query.users.findFirst({ where: eq(users.username, usernameB) }),
  ]);

  if (!userA || !userB) {
    throw new Error("One or both usernames not found.");
  }

  const existing = await db.query.friendships.findFirst({
    where: or(
      and(
        eq(friendships.requesterId, userA.id),
        eq(friendships.addresseeId, userB.id),
      ),
      and(
        eq(friendships.requesterId, userB.id),
        eq(friendships.addresseeId, userA.id),
      ),
    ),
  });

  if (existing) {
    await db
      .update(friendships)
      .set({ status: "accepted", respondedAt: new Date() })
      .where(eq(friendships.id, existing.id));
    console.log(`Existing friendship between "${usernameA}" and "${usernameB}" set to accepted.`);
  } else {
    await db.insert(friendships).values({
      requesterId: userA.id,
      addresseeId: userB.id,
      status: "accepted",
      respondedAt: new Date(),
    });
    console.log(`Created accepted friendship between "${usernameA}" and "${usernameB}".`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
