import { jwtVerify, SignJWT } from "jose";

export type SessionPayload = {
  userId: string;
};

const alg = "HS256";
const expiresIn = "30d";

function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodeSecret(secret));
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodeSecret(secret), {
      algorithms: [alg],
    });

    if (typeof payload.userId !== "string") return null;

    return { userId: payload.userId };
  } catch {
    return null;
  }
}
