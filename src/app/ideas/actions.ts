"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { boredomIdeas, boredomPicks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { pickIdea } from "@/lib/ideas/pick";

export type IdeaFormState = { error: string | null };

export async function addIdea(
  _prevState: IdeaFormState,
  formData: FormData,
): Promise<IdeaFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Escribí algo primero." };
  if (text.length > 200) return { error: "Muy largo, resumila un poco." };

  await db.insert(boredomIdeas).values({ text, createdByUserId: user.id });
  revalidatePath("/ideas");
  return { error: null };
}

export async function deleteIdea(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.delete(boredomIdeas).where(eq(boredomIdeas.id, id));
  revalidatePath("/ideas");
}

export type PickState = {
  idea: { id: string; text: string } | null;
  error: string | null;
};

export async function pickIdeaAction(
  _prevState: PickState,
  formData: FormData,
): Promise<PickState> {
  const user = await getCurrentUser();
  if (!user) return { idea: null, error: "No autenticado." };

  const ideas = await db.query.boredomIdeas.findMany();
  if (ideas.length === 0) {
    return { idea: null, error: "Todavía no cargaron ninguna idea." };
  }

  const picks = await db.query.boredomPicks.findMany({
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  const lastPickedAt = new Map<string, Date>();
  for (const pick of picks) {
    if (!lastPickedAt.has(pick.ideaId)) {
      lastPickedAt.set(pick.ideaId, pick.createdAt);
    }
  }

  const excludeRaw = String(formData.get("exclude") ?? "");
  const excludeIds = new Set(excludeRaw.split(",").filter(Boolean));

  const chosen = pickIdea(ideas, lastPickedAt, excludeIds);
  return {
    idea: chosen ? { id: chosen.id, text: chosen.text } : null,
    error: null,
  };
}

export async function markIdeaDone(ideaId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.insert(boredomPicks).values({ ideaId, userId: user.id });
  revalidatePath("/ideas");
}
