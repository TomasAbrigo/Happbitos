"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { respondToFriendRequest } from "@/app/friends/actions";

export function FriendRequestResponse({ friendshipId }: { friendshipId: string }) {
  const [pending, startTransition] = useTransition();

  function respond(accept: boolean) {
    startTransition(() => respondToFriendRequest(friendshipId, accept));
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={pending} onClick={() => respond(true)}>
        Aceptar
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => respond(false)}
      >
        Rechazar
      </Button>
    </div>
  );
}
