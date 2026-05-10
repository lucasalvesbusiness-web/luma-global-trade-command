import type { DealTemplate } from '@/lib/types/enums';
import { TechLabel } from '@/components/ui/TechLabel';

type ScopeRenderProps = {
  template: DealTemplate;
  payload: unknown;
};

const CADENCE_LABELS: Record<string, string> = {
  WEEKLY: 'semanal',
  BIWEEKLY: 'quinzenal',
  MONTHLY: 'mensal',
  QUARTERLY: 'trimestral',
};

export function ScopeRender({ template, payload }: ScopeRenderProps) {
  if (!payload || typeof payload !== 'object') {
    return <p className="text-sm text-ink-500">— sem escopo definido —</p>;
  }
  const scope = payload as Record<string, unknown>;

  return (
    <div className="flex flex-col gap-5">
      {!!scope.summary && (
        <Block label="Resumo">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-200">
            {String(scope.summary)}
          </p>
        </Block>
      )}

      {template === 'ONE_OFF' && (
        <div className="grid gap-4 md:grid-cols-2">
          {scope.expectedDurationDays != null && (
            <Block label="Duração prevista">
              <p className="num-marker text-base text-ink-100">
                {Number(scope.expectedDurationDays)} dias
              </p>
            </Block>
          )}
          {!!scope.preferredStartDate && (
            <Block label="Início desejado">
              <p className="num-marker text-sm text-ink-100">
                {String(scope.preferredStartDate)}
              </p>
            </Block>
          )}
          {!!scope.locationNotes && (
            <Block label="Local" className="md:col-span-2">
              <p className="text-sm text-ink-200">{String(scope.locationNotes)}</p>
            </Block>
          )}
        </div>
      )}

      {template === 'RECURRING' && (
        <div className="grid gap-4 md:grid-cols-3">
          {!!scope.cadence && (
            <Block label="Cadência">
              <p className="text-sm text-ink-100">
                {CADENCE_LABELS[String(scope.cadence)] ?? String(scope.cadence)}
              </p>
            </Block>
          )}
          {scope.cyclesCount != null && (
            <Block label="Ciclos previstos">
              <p className="num-marker text-base text-ink-100">
                {Number(scope.cyclesCount)}
              </p>
            </Block>
          )}
          {!!scope.startMonth && (
            <Block label="Início">
              <p className="num-marker text-sm text-ink-100">{String(scope.startMonth)}</p>
            </Block>
          )}
        </div>
      )}

      {template === 'PRODUCT_SUPPLY' && (
        <div className="grid gap-4 md:grid-cols-3">
          {!!scope.itemDescription && (
            <Block label="Item" className="md:col-span-3">
              <p className="text-sm text-ink-100">{String(scope.itemDescription)}</p>
            </Block>
          )}
          {scope.quantity != null && (
            <Block label="Quantidade">
              <p className="num-marker text-base text-ink-100">
                {Number(scope.quantity)} {String(scope.unit ?? '')}
              </p>
            </Block>
          )}
          {scope.expectedDeliveryDays != null && (
            <Block label="Prazo de entrega">
              <p className="num-marker text-sm text-ink-100">
                {Number(scope.expectedDeliveryDays)} dias
              </p>
            </Block>
          )}
        </div>
      )}
    </div>
  );
}

function Block({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={'flex flex-col gap-1.5 ' + (className ?? '')}>
      <TechLabel>{label}</TechLabel>
      {children}
    </div>
  );
}
