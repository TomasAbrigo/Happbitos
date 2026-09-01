export type CompletionHabit = {
  type: "binary" | "quantity";
  target?: number | null;
};

export type CompletionEntry = {
  completed?: boolean;
  quantity?: number | null;
};

export function isCompleted(
  habit: CompletionHabit,
  entry: CompletionEntry | undefined,
): boolean {
  if (!entry) return false;

  if (habit.type === "binary") {
    return entry.completed === true;
  }

  if (entry.quantity == null || habit.target == null) return false;
  return entry.quantity >= habit.target;
}
