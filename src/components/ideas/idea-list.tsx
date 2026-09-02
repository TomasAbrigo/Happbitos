"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addIdea, deleteIdea, type IdeaFormState } from "@/app/ideas/actions";

const initialState: IdeaFormState = { error: null };

type IdeaRow = {
  id: string;
  text: string;
  createdByUsername: string;
  pickCount: number;
  lastPickedAt: string | null;
  lastPickedByUsername: string | null;
};

function metaLabel(idea: IdeaRow) {
  if (!idea.lastPickedAt) return "Nunca se eligió";
  return `Última vez: ${idea.lastPickedAt} · ${idea.lastPickedByUsername} · ${idea.pickCount}x en total`;
}

function DeleteIdeaButton({ idea }: { idea: IdeaRow }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="text-muted-foreground shrink-0 text-xs font-medium hover:text-destructive"
          >
            Borrar
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Borrar &quot;{idea.text}&quot;?</DialogTitle>
          <DialogDescription>
            Se va de la lista compartida para siempre.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <form
            action={async () => {
              await deleteIdea(idea.id);
              setOpen(false);
            }}
          >
            <Button type="submit" variant="destructive">
              Sí, borrar
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddIdeaForm() {
  const [state, formAction, pending] = useActionState(addIdea, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <Input
        name="text"
        placeholder="Sumá una idea nueva..."
        className="h-9"
        maxLength={200}
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "..." : "Agregar"}
      </Button>
      {state.error && (
        <span className="text-destructive text-xs">{state.error}</span>
      )}
    </form>
  );
}

export function IdeaList({ ideas }: { ideas: IdeaRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      <AddIdeaForm />

      {ideas.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Ni una idea cargada. Empezá vos.
        </p>
      )}

      <div className="flex flex-col">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{idea.text}</p>
              <p className="text-muted-foreground text-xs">
                {metaLabel(idea)} · sumada por {idea.createdByUsername}
              </p>
            </div>
            <DeleteIdeaButton idea={idea} />
          </div>
        ))}
      </div>
    </div>
  );
}
