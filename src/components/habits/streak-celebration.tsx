"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const MILESTONES = new Set([4, 8, 12, 20]);
const CONFETTI = ["🎉", "🔥", "✨", "🎊"];

function storageKey(habitId: string) {
  return `happbitos-streak-seen:${habitId}`;
}

export function StreakCelebration({
  habitId,
  currentStreak,
  children,
}: {
  habitId: string;
  currentStreak: number;
  children: ReactNode;
}) {
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    const key = storageKey(habitId);
    const lastSeen = Number(localStorage.getItem(key) ?? "0");
    localStorage.setItem(key, String(currentStreak));

    if (currentStreak > lastSeen && MILESTONES.has(currentStreak)) {
      const showTimeout = setTimeout(() => setCelebrating(true), 0);
      const hideTimeout = setTimeout(() => setCelebrating(false), 2400);
      return () => {
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);
      };
    }
  }, [habitId, currentStreak]);

  return (
    <div className="relative inline-flex">
      {children}
      {celebrating && (
        <div className="pointer-events-none absolute inset-x-0 -top-3 flex justify-center gap-1">
          {CONFETTI.map((emoji, i) => (
            <span
              key={i}
              className="animate-in fade-in zoom-in slide-in-from-bottom-2 text-lg"
              style={{
                animationDelay: `${i * 90}ms`,
                animationDuration: "700ms",
                animationFillMode: "backwards",
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
