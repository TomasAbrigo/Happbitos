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

// Safari/WebKit only honors Notification.requestPermission() as a direct
// result of a user gesture (tap on the bell). Firing it automatically there
// either does nothing or, worse, can leave permission stuck at "denied"
// without the user having made a real choice. Every iOS/iPadOS browser runs
// on WebKit (Apple mandates it), so this covers Chrome/Firefox on iOS too.
function canAutoPrompt(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isMacSafari =
    /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
  return !isIOS && !isMacSafari;
}

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      isSubscribedToPush()
        .then((subscribed) => {
          setStatus(subscribed ? "on" : "off");
          if (
            !subscribed &&
            Notification.permission === "default" &&
            canAutoPrompt() &&
            !sessionStorage.getItem(AUTO_PROMPT_KEY)
          ) {
            sessionStorage.setItem(AUTO_PROMPT_KEY, "1");
            enable();
          }
        })
        .catch(() => {
          // A stale bundle after a redeploy (old Server Action id) or a
          // flaky network call must not leave the icon stuck invisible
          // forever in "loading" — fall back to showing it as off.
          setStatus("off");
        });
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  function enable() {
    setError(null);
    startTransition(async () => {
      try {
        if (Notification.permission === "denied") {
          setStatus("off");
          setError(
            "Bloqueaste las notificaciones antes. Tenés que habilitarlas desde los ajustes del navegador/sistema.",
          );
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
          setError("Falta configuración del servidor.");
          return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });

        const json = subscription.toJSON();
        const result = await subscribeToPush({
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
        });
        if (result.error) {
          setStatus("off");
          setError(result.error);
          return;
        }
        setStatus("on");
      } catch (err) {
        setStatus("off");
        setError(err instanceof Error ? err.message : "No se pudo activar.");
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
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={status === "on" ? disable : enable}
        disabled={pending}
        aria-label={status === "on" ? "Desactivar notificaciones" : "Activar notificaciones"}
        title={error ?? (status === "on" ? "Notificaciones activadas" : "Activar notificaciones")}
      >
        {status === "on" ? <Bell className="size-4" /> : <BellOff className="size-4" />}
      </Button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
