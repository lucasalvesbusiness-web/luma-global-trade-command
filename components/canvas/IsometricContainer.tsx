'use client';

import { useMemo } from 'react';

import type { LoadPlanItem } from '@/lib/canvas/types';
import type { SeedContainerType } from '@/data/seed/containers';
import { cn } from '@/lib/utils';

type Props = {
  container: SeedContainerType | null;
  items: LoadPlanItem[];
  occupationPct: number;
  alertsCritical?: boolean;
};

/**
 * Container em vista interior cutaway — projeção isométrica, paredes
 * frontal e lateral-direita removidas (como se as portas estivessem
 * abertas e a lateral fosse de vidro). O comprador "entra" no container.
 *
 * IMPORTANTE: a geometria aqui é proporcional ao container real (length ×
 * width), mas a contagem de pallets é uma aproximação comercial (slots
 * padrão EUR, 1 nível). Otimização volumétrica e empilhamento são
 * validados pela operação Luma antes de qualquer embarque.
 */

// Ângulo isométrico (30°)
const ISO = Math.PI / 6;
const COS = Math.cos(ISO);
const SIN = Math.sin(ISO);

// Projeção iso: (x, y, z) → tela
// X: comprimento do container (eixo que vai para "dentro")
// Y: largura do container (eixo horizontal dentro da vista)
// Z: altura (para cima na tela)
function iso(x: number, y: number, z: number) {
  const sx = (x - y) * COS;
  const sy = (x + y) * SIN - z;
  return { x: sx, y: sy };
}

export function IsometricContainer({
  container,
  items,
  occupationPct,
  alertsCritical = false,
}: Props) {
  const palette = useMemo(
    () => ['#556B2F', '#7A9A5E', '#8B6B4A', '#E6A84C', '#3E7C9E'],
    [],
  );
  const colorFor = useMemo(() => {
    const byKey = new Map<string, string>();
    items.forEach((it) => {
      const key = `${it.productSlug}::${it.varietyId}`;
      if (!byKey.has(key)) byKey.set(key, palette[byKey.size % palette.length]!);
    });
    return byKey;
  }, [items, palette]);

  if (!container) {
    return (
      <div className="flex aspect-[2/1] w-full items-center justify-center rounded-xl border border-dashed border-luma-ink/15 bg-white/40">
        <p className="text-xs uppercase tracking-[0.3em] text-luma-ink/45">
          Container não selecionado
        </p>
      </div>
    );
  }

  // Dimensões lógicas (proporcionais ao container real, mas em unidades de tela)
  // Mantemos aspect-ratio length:width e length:height dentro dessa projeção.
  const SCALE = 12; // px por metro-interno
  const L = container.internalLengthM * SCALE; // profundidade
  const W = container.internalWidthM * SCALE; // largura interna
  const H = container.internalHeightM * SCALE; // altura

  // Grid de pallets: 2 colunas (larg) × maxPallets/2 linhas (profund)
  const cols = 2;
  const rows = Math.ceil(container.maxPallets / cols);
  const palletDepth = L / rows;
  const palletWidth = W / cols;
  const palletHeight = H * 0.22; // pallet com carga (~40-60 cm em 2.5m)

  // ----- Vertices do container (caixa aberta: sem parede frontal e sem lateral direita) -----
  // Paredes visíveis: CHÃO + PAREDE ESQUERDA + PAREDE TRASEIRA

  // Chão (parallelogram)
  const floor = [
    iso(0, 0, 0),
    iso(L, 0, 0),
    iso(L, W, 0),
    iso(0, W, 0),
  ];

  // Parede esquerda (Y = 0)
  const leftWall = [
    iso(0, 0, 0),
    iso(L, 0, 0),
    iso(L, 0, H),
    iso(0, 0, H),
  ];

  // Parede traseira (X = L)
  const backWall = [
    iso(L, 0, 0),
    iso(L, W, 0),
    iso(L, W, H),
    iso(L, 0, H),
  ];

  // Borda fantasma da parede direita (para dar sensação de corte) — só uma linha
  const rightEdge = [iso(0, W, 0), iso(0, W, H)];
  const frontTopEdge = [iso(0, 0, H), iso(0, W, H)];

  // Calcula bounding box da projeção
  const allPts = [...floor, ...leftWall, ...backWall, ...rightEdge, ...frontTopEdge];
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  const pad = 30;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad + 24; // espaço pro legend inferior
  const svgW = maxX - minX;
  const svgH = maxY - minY;

  const toStr = (p: { x: number; y: number }) =>
    `${(p.x - minX).toFixed(1)},${(p.y - minY).toFixed(1)}`;

  // Preencher slots — em ordem: para cada item, expandir em pallets
  type FilledSlot = { color: string };
  const filled: FilledSlot[] = [];
  for (const it of items) {
    const color = colorFor.get(`${it.productSlug}::${it.varietyId}`) ?? palette[0]!;
    for (let i = 0; i < it.qtyPallets; i++) filled.push({ color });
  }
  const totalPallets = filled.length;
  const maxPallets = container.maxPallets;

  // Renderizar pallets em ordem tal que os "de trás" são desenhados primeiro
  // (painter's algorithm básico: ordenar por (row desc, col desc) → profundos primeiro)
  const slotList: { row: number; col: number; idx: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slotList.push({ row: r, col: c, idx: r * cols + c });
    }
  }
  // Ordena: maior row (mais longe) primeiro; dentro da row, maior col primeiro
  slotList.sort((a, b) => {
    if (a.row !== b.row) return b.row - a.row;
    return b.col - a.col;
  });

  const wallStroke = alertsCritical
    ? 'rgba(139, 107, 74, 0.9)'
    : 'hsl(var(--luma-olive))';
  const wallFill = alertsCritical
    ? 'rgba(139, 107, 74, 0.05)'
    : 'rgba(85, 107, 47, 0.035)';

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        role="img"
        aria-label={`Container ${container.displayName} — ${Math.round(occupationPct * 100)}% ocupação`}
        className="block h-auto w-full overflow-visible"
      >
        {/* Paredes — desenhadas antes dos pallets para ficarem atrás */}
        {/* Parede traseira */}
        <polygon
          points={backWall.map(toStr).join(' ')}
          fill={wallFill}
          stroke={wallStroke}
          strokeWidth={1}
          strokeOpacity={0.7}
        />
        {/* Parede esquerda */}
        <polygon
          points={leftWall.map(toStr).join(' ')}
          fill={wallFill}
          stroke={wallStroke}
          strokeWidth={1}
          strokeOpacity={0.7}
        />
        {/* Chão */}
        <polygon
          points={floor.map(toStr).join(' ')}
          fill={'rgba(247, 244, 238, 0.6)'}
          stroke={wallStroke}
          strokeWidth={1}
          strokeOpacity={0.8}
        />

        {/* Guias de pallet no chão */}
        {Array.from({ length: rows + 1 }).map((_, r) => {
          const x = r * palletDepth;
          const a = iso(x, 0, 0);
          const b = iso(x, W, 0);
          return (
            <line
              key={`gr-${r}`}
              x1={a.x - minX}
              y1={a.y - minY}
              x2={b.x - minX}
              y2={b.y - minY}
              stroke={wallStroke}
              strokeOpacity={0.18}
              strokeDasharray="2 3"
              strokeWidth={0.6}
            />
          );
        })}
        {Array.from({ length: cols + 1 }).map((_, c) => {
          const y = c * palletWidth;
          const a = iso(0, y, 0);
          const b = iso(L, y, 0);
          return (
            <line
              key={`gc-${c}`}
              x1={a.x - minX}
              y1={a.y - minY}
              x2={b.x - minX}
              y2={b.y - minY}
              stroke={wallStroke}
              strokeOpacity={0.18}
              strokeDasharray="2 3"
              strokeWidth={0.6}
            />
          );
        })}

        {/* Bordas pontilhadas das paredes removidas (cutaway visual) */}
        <line
          x1={rightEdge[0]!.x - minX}
          y1={rightEdge[0]!.y - minY}
          x2={rightEdge[1]!.x - minX}
          y2={rightEdge[1]!.y - minY}
          stroke={wallStroke}
          strokeOpacity={0.4}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <line
          x1={frontTopEdge[0]!.x - minX}
          y1={frontTopEdge[0]!.y - minY}
          x2={frontTopEdge[1]!.x - minX}
          y2={frontTopEdge[1]!.y - minY}
          stroke={wallStroke}
          strokeOpacity={0.4}
          strokeDasharray="3 3"
          strokeWidth={1}
        />

        {/* Pallets — ordem painter (profundos primeiro) */}
        {slotList.map(({ row, col, idx }) => {
          if (idx >= maxPallets) return null;
          const slot = filled[idx];

          const x0 = row * palletDepth;
          const y0 = col * palletWidth;
          const inset = 2;

          // 8 vértices do cubo do pallet
          const v = {
            // base
            b00: iso(x0 + inset, y0 + inset, 0),
            b10: iso(x0 + palletDepth - inset, y0 + inset, 0),
            b11: iso(x0 + palletDepth - inset, y0 + palletWidth - inset, 0),
            b01: iso(x0 + inset, y0 + palletWidth - inset, 0),
            // topo
            t00: iso(x0 + inset, y0 + inset, palletHeight),
            t10: iso(x0 + palletDepth - inset, y0 + inset, palletHeight),
            t11: iso(x0 + palletDepth - inset, y0 + palletWidth - inset, palletHeight),
            t01: iso(x0 + inset, y0 + palletWidth - inset, palletHeight),
          };

          if (!slot) {
            // Slot vazio: só outline pontilhado da base
            return (
              <polygon
                key={`empty-${idx}`}
                points={[v.b00, v.b10, v.b11, v.b01].map(toStr).join(' ')}
                fill="none"
                stroke={wallStroke}
                strokeOpacity={0.25}
                strokeDasharray="2 2"
                strokeWidth={0.75}
              />
            );
          }

          // Faces visíveis do cubo preenchido:
          // Topo (sempre visível)
          const top = [v.t00, v.t10, v.t11, v.t01].map(toStr).join(' ');
          // Face "esquerda" (Y = y0, visível pois olhamos de 3/4 frente-esquerda)
          const left = [v.b00, v.b10, v.t10, v.t00].map(toStr).join(' ');
          // Face "frente" (X = x0+depth, a que aparece na entrada)
          // Na verdade, com iso 30° padrão (olhando de cima-direita), a face
          // frontal visível é X = x0+palletDepth. Mas como removemos a parede
          // frontal, mostramos sim. Pros pallets: cada um tem 2 faces visíveis.
          const right = [v.b10, v.b11, v.t11, v.t10].map(toStr).join(' ');

          return (
            <g key={`p-${idx}`}>
              <polygon points={left} fill={slot.color} fillOpacity={0.78} stroke="#fff" strokeOpacity={0.5} strokeWidth={0.5} />
              <polygon points={right} fill={slot.color} fillOpacity={0.62} stroke="#fff" strokeOpacity={0.5} strokeWidth={0.5} />
              <polygon points={top} fill={slot.color} fillOpacity={0.92} stroke="#fff" strokeOpacity={0.7} strokeWidth={0.5} />
            </g>
          );
        })}

        {/* Legenda de dimensões (canto inferior esquerdo) */}
        <text
          x={10}
          y={svgH - 10}
          fontFamily="ui-monospace, monospace"
          fontSize={10}
          fill="hsl(var(--luma-ink) / 0.55)"
        >
          {container.internalLengthM.toFixed(2)} × {container.internalWidthM.toFixed(2)} ×{' '}
          {container.internalHeightM.toFixed(2)} m
        </text>
      </svg>

      <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] text-luma-ink/65">
        <span>
          {totalPallets} / {maxPallets} pallets
        </span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums',
            occupationPct > 1
              ? 'bg-[hsl(var(--luma-earth)_/_0.15)] text-[hsl(var(--luma-earth))]'
              : 'bg-white/60 text-luma-ink/75',
          )}
        >
          {Math.round(occupationPct * 100)}%
        </span>
      </div>
    </div>
  );
}
