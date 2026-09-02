"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="bg-primary text-primary-foreground hidden flex-col justify-between p-12 md:flex md:w-1/2">
        <span className="font-heading text-2xl font-extrabold">
          Happbitos
        </span>
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="font-heading text-5xl leading-tight font-bold">
            Dos personas, cero excusas.
          </h1>
          <span className="bg-accent h-1.5 w-28 rounded-full" />
          <p className="text-primary-foreground/70 text-[17px]">
            Entrá y marcá lo que hiciste. El otro está mirando, y vos también.
          </p>
        </div>
        <p className="text-primary-foreground/50 text-xs">
          Sin rachas falsas. Sin trampa. Bueno, un poco.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 md:p-12">
        <div className="bg-card ring-foreground/10 w-full max-w-sm rounded-xl p-6 ring-1 md:max-w-sm md:rounded-none md:bg-transparent md:p-0 md:ring-0">
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <span className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-[10px]">
              <Check className="size-[18px]" strokeWidth={3} />
            </span>
            <div>
              <h2 className="font-heading text-2xl font-medium">Happbitos</h2>
            </div>
          </div>
          <p className="text-muted-foreground mb-6 text-sm md:hidden">
            Dos personas, cero excusas. Entrá y marcá lo que hiciste.
          </p>

          <div className="mb-6 hidden md:block">
            <h1 className="font-heading text-3xl font-extrabold">Entrá</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Usuario y contraseña. Del otro lado ya te están mirando.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" name="username" required autoFocus />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full text-base"
            >
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-muted-foreground mt-4 text-center text-xs md:hidden">
            Somos dos. No hay registro. Ya sabés quién sos.
          </p>
          <p className="text-muted-foreground mt-4 hidden text-xs md:block">
            Son solo dos. Ya sabés cuál sos.
          </p>
        </div>
      </div>
    </div>
  );
}
