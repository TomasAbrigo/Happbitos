"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/credentials";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createSessionToken } from "@/lib/auth/session";

export type LoginState = { error: string | null };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const genericError = { error: "Usuario o contraseña incorrectos." };

  if (!username || !password) return genericError;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) return genericError;

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) return genericError;

  const token = await createSessionToken(
    { userId: user.id },
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

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
