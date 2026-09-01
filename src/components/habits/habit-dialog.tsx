"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HabitForm } from "./habit-form";
import type { HabitFormState } from "@/app/habits/actions";

type HabitDialogProps = {
  trigger: React.ReactElement;
  title: string;
  action: (
    state: HabitFormState,
    formData: FormData,
  ) => Promise<HabitFormState>;
  defaultValues?: {
    name: string;
    type: "binary" | "quantity";
    target: number | null;
    frequencyKind: "daily" | "n_per_week";
    timesPerWeek: number | null;
  };
  submitLabel: string;
};

export function HabitDialog({
  trigger,
  title,
  action,
  defaultValues,
  submitLabel,
}: HabitDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <HabitForm
          action={action}
          defaultValues={defaultValues}
          submitLabel={submitLabel}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
