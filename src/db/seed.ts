import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/credentials";
import { db } from "./index";
import { users } from "./schema";

async function main() {
  const [username, password] = process.argv.slice(2);

  if (!username || !password) {
    console.error("Usage: npm run db:seed -- <username> <password>");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, existing.id));
    console.log(`Updated password for existing user "${username}".`);
  } else {
    await db.insert(users).values({ username, passwordHash });
    console.log(`Created user "${username}".`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
