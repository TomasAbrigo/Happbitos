"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkInChallenge, respondToChallenge } from "@/app/challenges/actions";
import { computeChallengeProgress } from "@/lib/challenges/challenge-progress";
import type { challenges } from "@/db/schema";

type Challenge = typeof challenges.$inferSelect;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatDate(iso: string) {
  return dateFormatter.format(new Date(`${iso}T00:00:00.000Z`));
}

function ProgressRow({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: "me" | "other";
}) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((count / total) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">
          {count}/{total} días
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${tone === "me" ? "bg-primary" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Challenge["status"] }) {
  if (status === "pending") return <Badge variant="secondary">Pendiente</Badge>;
  if (status === "declined") return <Badge variant="destructive">Rechazado</Badge>;
  return <Badge variant="secondary">En marcha</Badge>;
}

export function ChallengeCard({
  challenge,
  creatorUsername,
  otherUsername,
  isMine,
  iDidToday,
  myCheckins,
  otherCheckins,
  today,
}: {
  challenge: Challenge;
  creatorUsername: string;
  otherUsername: string;
  isMine: boolean;
  iDidToday: boolean;
  myCheckins: number;
  otherCheckins: number;
  today: string;
}) {
  const [pending, startTransition] = useTransition();
  const progress = computeChallengeProgress(
    challenge.startDate,
    challenge.endDate,
    today,
    myCheckins,
    otherCheckins,
  );
  const needsResponse = challenge.status === "pending" && !isMine;

  function respond(accept: boolean) {
    startTransition(() => respondToChallenge(challenge.id, accept));
  }

  function checkIn() {
    startTransition(() => checkInChallenge(challenge.id));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base break-words">{challenge.title}</CardTitle>
          <p className="text-muted-foreground text-xs">
            {formatDate(challenge.startDate)} → {formatDate(challenge.endDate)} ·
            propuesto por {isMine ? "vos" : creatorUsername}
          </p>
        </div>
        <StatusBadge status={challenge.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {needsResponse ? (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => respond(true)} disabled={pending}>
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => respond(false)}
              disabled={pending}
            >
              Rechazar
            </Button>
          </div>
        ) : challenge.status === "pending" ? (
          <p className="text-muted-foreground text-sm">
            Esperando que {otherUsername} responda.
          </p>
        ) : challenge.status === "declined" ? (
          <p className="text-muted-foreground text-sm">
            {otherUsername} lo rechazó. Se puede proponer otro.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              <ProgressRow
                label="Vos"
                count={myCheckins}
                total={progress.totalDays}
                tone="me"
              />
              <ProgressRow
                label={otherUsername}
                count={otherCheckins}
                total={progress.totalDays}
                tone="other"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {progress.isFinished
                ? "Terminado."
                : progress.hasStarted
                  ? `Día ${progress.elapsedDays} de ${progress.totalDays}.`
                  : "Todavía no arrancó."}
            </p>
            {!progress.isFinished && progress.hasStarted && (
              <>
                {iDidToday ? (
                  <span className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
                    <Check className="size-4" strokeWidth={3} />
                    Ya marcaste hoy
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={checkIn}
                    disabled={pending}
                  >
                    {pending ? "..." : "Marcar hoy"}
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
