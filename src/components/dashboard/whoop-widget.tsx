import { Activity, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { disconnectWhoop } from "@/app/whoop/actions";
import type { WhoopStatus } from "@/lib/whoop/get-whoop-status";

function recoveryTone(score: number) {
  if (score >= 67) return "text-success";
  if (score >= 34) return "text-accent-foreground";
  return "text-destructive";
}

export function WhoopWidget({ status }: { status: WhoopStatus }) {
  if (!status.connected) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Activity className="text-muted-foreground size-4" />
          <CardTitle className="text-base">WHOOP</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            Conectá tu WHOOP para ver tu recovery y tu sueño acá.
          </p>
          <Button
            size="sm"
            nativeButton={false}
            render={<a href="/api/whoop/connect" />}
          >
            Conectar WHOOP
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="text-muted-foreground size-4" />
          <CardTitle className="text-base">WHOOP</CardTitle>
        </div>
        <form action={disconnectWhoop}>
          <button
            type="submit"
            className="text-muted-foreground text-xs hover:underline"
          >
            Desconectar
          </button>
        </form>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {status.recovery ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Recovery</span>
            <span
              className={`font-heading text-xl font-bold ${recoveryTone(status.recovery.score)}`}
            >
              {status.recovery.score}%
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            Todavía no hay datos de recovery.
          </p>
        )}
        {status.sleep ? (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Moon className="size-3.5" /> Sueño
            </span>
            <span className="text-sm font-semibold">
              {status.sleep.performancePercentage}%
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            Todavía no hay datos de sueño.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
