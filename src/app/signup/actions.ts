"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/credentials";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createSessionToken } from "@/lib/auth/session";

export type SignupState = { error: string | null };

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "El usuario debe tener entre 3 y 20 caracteres (letras, números o _).",
    };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (existing) {
    return { error: "Ese usuario ya existe." };
  }

  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const [created] = await db
      .insert(users)
      .values({ username, passwordHash })
      .returning({ id: users.id });
    userId = created.id;
  } catch {
    return { error: "Ese usuario ya existe." };
  }

  const token = await createSessionToken(
    { userId },
    process.env.AUTH_SECRET!,
  );

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
