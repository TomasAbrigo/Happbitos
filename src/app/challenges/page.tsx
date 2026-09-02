import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { challengeCheckins, challenges } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOtherUser } from "@/lib/auth/other-user";
import { todayIso } from "@/lib/date";
import { PrimaryHeader } from "@/components/app-header";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { ChallengeForm } from "@/components/challenges/challenge-form";

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const friend = await getOtherUser(user.id);

  const myChallenges = await db.query.challenges.findMany({
    where: or(
      eq(challenges.createdByUserId, user.id),
      eq(challenges.invitedUserId, user.id),
    ),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });

  const challengeIds = myChallenges.map((c) => c.id);
  const checkins = challengeIds.length
    ? await db.query.challengeCheckins.findMany({
        where: inArray(challengeCheckins.challengeId, challengeIds),
      })
    : [];

  const allUsers = await db.query.users.findMany({
    columns: { id: true, username: true },
  });
  const usernameById = new Map(allUsers.map((u) => [u.id, u.username]));

  const today = todayIso();

  const cards = myChallenges.map((challenge) => {
    const iDidToday = checkins.some(
      (c) =>
        c.challengeId === challenge.id &&
        c.userId === user.id &&
        c.date === today,
    );
    const myCheckins = checkins.filter(
      (c) => c.challengeId === challenge.id && c.userId === user.id,
    ).length;
    const otherUserId =
      challenge.createdByUserId === user.id
        ? challenge.invitedUserId
        : challenge.createdByUserId;
    const otherCheckins = checkins.filter(
      (c) => c.challengeId === challenge.id && c.userId === otherUserId,
    ).length;

    return {
      challenge,
      creatorUsername: usernameById.get(challenge.createdByUserId) ?? "?",
      otherUsername: usernameById.get(otherUserId) ?? "?",
      isMine: challenge.createdByUserId === user.id,
      iDidToday,
      myCheckins,
      otherCheckins,
    };
  });

  return (
    <div className="flex min-h-screen flex-col items-center">
      <PrimaryHeader username={user.username} />

      <div className="flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Desafíos</h1>
          <p className="text-muted-foreground text-sm">
            Un compromiso con fecha de cierre, entre los dos. No es un
            hábito de siempre, es un round.
          </p>
        </div>

        <ChallengeForm disabled={!friend} />

        {cards.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Ni un desafío todavía. Proponé el primero.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <ChallengeCard key={card.challenge.id} {...card} today={today} />
          ))}
        </div>
      </div>
    </div>
  );
}
