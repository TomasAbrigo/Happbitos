"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  isSubscribedToPush,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/app/push/actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "loading" | "off" | "on";

const AUTO_PROMPT_KEY = "happbitos-push-auto-prompted";

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      isSubscribedToPush().then((subscribed) => {
        setStatus(subscribed ? "on" : "off");
        if (
          !subscribed &&
          Notification.permission === "default" &&
          !sessionStorage.getItem(AUTO_PROMPT_KEY)
        ) {
          sessionStorage.setItem(AUTO_PROMPT_KEY, "1");
          enable();
        }
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  function enable() {
    startTransition(async () => {
      try {
        if (Notification.permission === "denied") {
          setStatus("off");
          return;
        }
        const permission =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("off");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          setStatus("off");
          return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });

        const json = subscription.toJSON();
        await subscribeToPush({
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
        });
        setStatus("on");
      } catch {
        setStatus("off");
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await unsubscribeFromPush(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setStatus("off");
      } catch {
        setStatus("off");
      }
    });
  }

  if (status === "unsupported" || status === "loading") return null;

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      onClick={status === "on" ? disable : enable}
      disabled={pending}
      aria-label={status === "on" ? "Desactivar notificaciones" : "Activar notificaciones"}
      title={status === "on" ? "Notificaciones activadas" : "Activar notificaciones"}
    >
      {status === "on" ? <Bell className="size-4" /> : <BellOff className="size-4" />}
    </Button>
  );
}
