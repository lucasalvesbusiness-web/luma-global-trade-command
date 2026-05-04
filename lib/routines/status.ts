/**
 * Cálculo de status de rotina fotográfica por FieldPlot.
 * Pura — sem dependência de Prisma.
 */

export type RoutineStatus =
  | 'UP_TO_DATE'
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'PAUSED'
  | 'NEVER_SUBMITTED';

export type RoutineConfig = {
  cadenceDays: number;
  active: boolean;
};

export type RoutineSnapshot = {
  status: RoutineStatus;
  /** Próximo prazo de submissão (null se PAUSED ou sem rotina). */
  nextDueAt: Date | null;
  /** Dias desde a última submissão. null se nunca submeteu. */
  daysSinceLastSubmission: number | null;
};

const DUE_SOON_WINDOW_DAYS = 2;

export function computeRoutineStatus(
  routine: RoutineConfig | null,
  lastSubmissionAt: Date | null,
  now: Date = new Date(),
): RoutineSnapshot {
  if (!routine) {
    return { status: 'NEVER_SUBMITTED', nextDueAt: null, daysSinceLastSubmission: null };
  }
  if (!routine.active) {
    return { status: 'PAUSED', nextDueAt: null, daysSinceLastSubmission: null };
  }
  if (!lastSubmissionAt) {
    return { status: 'NEVER_SUBMITTED', nextDueAt: now, daysSinceLastSubmission: null };
  }

  const cadenceMs = routine.cadenceDays * 24 * 60 * 60 * 1000;
  const nextDueAt = new Date(lastSubmissionAt.getTime() + cadenceMs);
  const msUntilDue = nextDueAt.getTime() - now.getTime();
  const daysSinceLastSubmission = Math.floor(
    (now.getTime() - lastSubmissionAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (msUntilDue < 0) {
    return { status: 'OVERDUE', nextDueAt, daysSinceLastSubmission };
  }
  if (msUntilDue <= DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    return { status: 'DUE_SOON', nextDueAt, daysSinceLastSubmission };
  }
  return { status: 'UP_TO_DATE', nextDueAt, daysSinceLastSubmission };
}

export function currentCycleWindow(
  cadenceDays: number,
  reference: Date = new Date(),
): { cycleStart: Date; cycleEnd: Date } {
  const cycleEnd = reference;
  const cycleStart = new Date(
    reference.getTime() - cadenceDays * 24 * 60 * 60 * 1000,
  );
  return { cycleStart, cycleEnd };
}
