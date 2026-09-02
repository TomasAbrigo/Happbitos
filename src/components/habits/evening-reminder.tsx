"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { todayIso } from "@/lib/date";

const REMINDER_HOUR = 20;

function dismissedKey() {
  return `happbitos-evening-dismissed:${todayIso()}`;
}

export function EveningReminder({
  doneToday,
  total,
}: {
  doneToday: number;
  total: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (total === 0 || doneToday >= total) return;
    if (new Date().getHours() < REMINDER_HOUR) return;
    if (sessionStorage.getItem(dismissedKey())) return;

    const timeout = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(timeout);
  }, [doneToday, total]);

  function dismiss() {
    sessionStorage.setItem(dismissedKey(), "1");
    setVisible(false);
  }

  if (!visible) return null;

  const missing = total - doneToday;

  return (
    <div className="bg-accent/20 ring-accent/40 animate-in fade-in slide-in-from-top-1 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ring-1 duration-300">
      <span>
        Che, todavía te quedan {missing} hábito{missing === 1 ? "" : "s"} sin
        marcar hoy. A tiempo estás.
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="text-muted-foreground shrink-0 hover:text-foreground"
        aria-label="Cerrar aviso"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
