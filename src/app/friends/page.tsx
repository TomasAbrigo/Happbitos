import { ne } from "drizzle-orm";
import { Check } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRelationshipStatuses } from "@/lib/friends/get-friends";
import { PrimaryHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FriendRequestButton } from "@/components/friends/friend-request-button";
import { FriendRequestResponse } from "@/components/friends/friend-request-response";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const otherUsers = await db.query.users.findMany({
    where: ne(users.id, user.id),
    columns: { id: true, username: true },
    orderBy: (u, { asc }) => [asc(u.username)],
  });
  const statuses = await getRelationshipStatuses(user.id);

  return (
    <div className="flex min-h-screen flex-col items-center">
      <PrimaryHeader username={user.username} />

      <div className="flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Amigos</h1>
          <p className="text-muted-foreground text-sm">
            Mandá solicitudes y seguí el progreso de la gente que aceptes.
          </p>
        </div>

        {otherUsers.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Todavía no hay nadie más registrado.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {otherUsers.map((other) => {
            const relation = statuses.get(other.id);
            const status = relation?.status ?? "none";

            return (
              <Card key={other.id}>
                <CardContent className="flex flex-row flex-wrap items-center justify-between gap-3 py-4">
                  <span className="font-heading text-base font-bold">
                    {other.username}
                  </span>

                  {status === "friends" && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Check className="size-3" strokeWidth={3} />
                        Amigos
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={`/friend?id=${other.id}`} />}
                      >
                        Ver progreso
                      </Button>
                    </div>
                  )}

                  {status === "request_sent" && (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}

                  {status === "request_received" && relation && (
                    <FriendRequestResponse friendshipId={relation.friendshipId} />
                  )}

                  {status === "none" && (
                    <FriendRequestButton targetUserId={other.id} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
