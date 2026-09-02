import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function PrimaryHeader({ username }: { username: string }) {
  return (
    <header className="bg-card w-full border-b">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-heading text-lg font-extrabold">
            Happbitos
          </Link>
          <span className="text-muted-foreground text-sm">
            | Hola, {username}.
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Mis hábitos
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/summary" />}>
            Resumen semanal
          </Button>
          <Button
            size="sm"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/friend" />}
          >
            Progreso del otro
          </Button>
          <Button
            size="sm"
            variant="accent"
            nativeButton={false}
            render={<Link href="/ideas" />}
          >
            ¿Aburrido?
          </Button>
          <form action={logout}>
            <Button type="submit" size="sm" variant="ghost">
              Salir
            </Button>
          </form>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function DetailHeader({
  backHref,
  backLabel,
  right,
}: {
  backHref: string;
  backLabel: string;
  right?: ReactNode;
}) {
  return (
    <header className="bg-card w-full border-b">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 md:px-8">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          ← {backLabel}
        </Link>
        <div className="flex items-center gap-3">
          {right ?? (
            <span className="font-heading text-muted-foreground text-sm font-bold">
              Happbitos
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
