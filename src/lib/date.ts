export const APP_TIMEZONE = "America/Argentina/Buenos_Aires";
const APP_UTC_OFFSET = "-03:00";

export function toIsoDateInTz(date: Date, timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayIso(): string {
  return toIsoDateInTz(new Date());
}

export function startOfDayInTz(iso: string): Date {
  return new Date(`${iso}T00:00:00${APP_UTC_OFFSET}`);
}

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekStartIso(iso: string): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

export function currentWeekStartIso(): string {
  return weekStartIso(todayIso());
}
