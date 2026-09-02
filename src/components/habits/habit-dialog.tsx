"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HabitForm, type HabitFormDefaultValues } from "./habit-form";
import type { HabitFormState } from "@/app/habits/actions";

type HabitDialogProps = {
  trigger: React.ReactElement;
  title: string;
  description?: string;
  action: (
    state: HabitFormState,
    formData: FormData,
  ) => Promise<HabitFormState>;
  defaultValues?: HabitFormDefaultValues;
  submitLabel: string;
};

export function HabitDialog({
  trigger,
  title,
  description,
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
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
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
