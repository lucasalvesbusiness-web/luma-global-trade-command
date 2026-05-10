'use client';

import type { DealRoomStatus } from '@/lib/types/enums';
import { dealRoomStatusLabels } from '@/lib/status/enums';
import { cn } from '@/lib/utils';

const MAIN_PATH: DealRoomStatus[] = [
  'OPENED',
  'SCOPED',
  'QUOTED',
  'ACCEPTED',
  'IN_PROGRESS',
  'DELIVERED',
  'CONFIRMED',
  'CLOSED',
];

const SHORT_LABELS: Record<DealRoomStatus, string> = {
  OPENED: 'Aberto',
  SCOPED: 'Escopo',
  QUOTED: 'Cotado',
  ACCEPTED: 'Aceito',
  IN_PROGRESS: 'Execução',
  DELIVERED: 'Entregue',
  CONFIRMED: 'Confirmado',
  CLOSED: 'Encerrado',
  DISPUTED: 'Disputa',
  CANCELLED: 'Cancelado',
};

export function FSMStepper({ status }: { status: DealRoomStatus }) {
  const isOffshoot = status === 'DISPUTED' || status === 'CANCELLED';
  const currentIndex = isOffshoot ? -1 : MAIN_PATH.indexOf(status);

  return (
    <div className="relative w-full overflow-x-auto">
      <ol className="flex items-center gap-0 min-w-fit">
        {MAIN_PATH.map((step, i) => {
          const past = !isOffshoot && i < currentIndex;
          const current = !isOffshoot && i === currentIndex;
          const future = !current && !past;

          return (
            <li key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full transition-all duration-500 ease-cinematic',
                    past && 'bg-ink-100',
                    current &&
                      'bg-amber animate-amber-pulse ring-4 ring-amber/15',
                    future && 'border border-ink-500 bg-transparent',
                  )}
                />
                <span
                  className={cn(
                    'text-[9px] uppercase tracking-wider tabular',
                    past && 'text-ink-300',
                    current && 'text-amber-glow',
                    future && 'text-ink-500',
                  )}
                >
                  {SHORT_LABELS[step]}
                </span>
              </div>
              {i < MAIN_PATH.length - 1 && (
                <div
                  aria-hidden
                  className={cn(
                    'mx-1.5 h-px w-6 -mt-4 transition-colors md:w-10',
                    i < currentIndex ? 'bg-ink-100' : 'bg-ink-700',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {isOffshoot && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              status === 'DISPUTED'
                ? 'bg-yellow-400 animate-amber-pulse'
                : 'bg-ink-500',
            )}
          />
          <span className="text-xs uppercase tracking-wider text-yellow-300">
            {dealRoomStatusLabels[status]?.['pt-br'] ?? status}
          </span>
        </div>
      )}
    </div>
  );
}
