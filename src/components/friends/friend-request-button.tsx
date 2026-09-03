"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendFriendRequest } from "@/app/friends/actions";

export function FriendRequestButton({ targetUserId }: { targetUserId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await sendFriendRequest(targetUserId);
        })
      }
    >
      {pending ? "..." : "Agregar"}
    </Button>
  );
}
