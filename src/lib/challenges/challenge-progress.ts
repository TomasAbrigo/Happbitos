export type ChallengeProgress = {
  totalDays: number;
  elapsedDays: number;
  myCheckins: number;
  otherCheckins: number;
  isFinished: boolean;
  hasStarted: boolean;
};

function daysBetweenInclusive(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00.000Z`);
  const end = new Date(`${endIso}T00:00:00.000Z`);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function computeChallengeProgress(
  startDate: string,
  endDate: string,
  today: string,
  myCheckinCount: number,
  otherCheckinCount: number,
): ChallengeProgress {
  const totalDays = daysBetweenInclusive(startDate, endDate);
  const hasStarted = today >= startDate;
  const isFinished = today > endDate;

  const cappedToday = today < startDate ? startDate : today > endDate ? endDate : today;
  const elapsedDays = hasStarted ? daysBetweenInclusive(startDate, cappedToday) : 0;

  return {
    totalDays,
    elapsedDays,
    myCheckins: myCheckinCount,
    otherCheckins: otherCheckinCount,
    isFinished,
    hasStarted,
  };
}
