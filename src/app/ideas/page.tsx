import { db } from "@/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PrimaryHeader } from "@/components/app-header";
import { IdeaPicker } from "@/components/ideas/idea-picker";
import { IdeaList } from "@/components/ideas/idea-list";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export default async function IdeasPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [ideas, picks, allUsers] = await Promise.all([
    db.query.boredomIdeas.findMany({
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    }),
    db.query.boredomPicks.findMany({
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    }),
    db.query.users.findMany({ columns: { id: true, username: true } }),
  ]);

  const usernameById = new Map(allUsers.map((u) => [u.id, u.username]));

  const pickStatsByIdea = new Map<
    string,
    { count: number; lastAt: Date; lastByUserId: string }
  >();
  for (const pick of picks) {
    const existing = pickStatsByIdea.get(pick.ideaId);
    if (existing) {
      existing.count++;
    } else {
      pickStatsByIdea.set(pick.ideaId, {
        count: 1,
        lastAt: pick.createdAt,
        lastByUserId: pick.userId,
      });
    }
  }

  const ideaRows = ideas.map((idea) => {
    const stats = pickStatsByIdea.get(idea.id);
    return {
      id: idea.id,
      text: idea.text,
      createdByUsername: usernameById.get(idea.createdByUserId) ?? "?",
      pickCount: stats?.count ?? 0,
      lastPickedAt: stats ? dateFormatter.format(stats.lastAt) : null,
      lastPickedByUsername: stats
        ? (usernameById.get(stats.lastByUserId) ?? "?")
        : null,
    };
  });

  return (
    <div className="flex min-h-screen flex-col items-center">
      <PrimaryHeader username={user.username} />

      <div className="flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">¿Aburrido/a?</h1>
          <p className="text-muted-foreground text-sm">
            No es un hábito, no suma racha, no te reclama nada. Es la caja de
            ideas para cuando no tenés nada mejor que hacer.
          </p>
        </div>

        <IdeaPicker />

        <div>
          <h2 className="font-heading mb-2 text-lg font-bold">
            Todas las ideas
          </h2>
          <IdeaList ideas={ideaRows} />
        </div>
      </div>
    </div>
  );
}
