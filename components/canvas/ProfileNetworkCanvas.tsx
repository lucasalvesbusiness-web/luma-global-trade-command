'use client';

import { useMemo } from 'react';

import { NetworkCanvas } from './NetworkCanvas';

export type Counterparty = {
  id: string;
  slug: string;
  name: string;
  weight: number; // # of confirmed deals shared with center
};

export function ProfileNetworkCanvas({
  centerId,
  counterparties,
}: {
  centerId: string;
  counterparties: Counterparty[];
}) {
  const { nodes, links } = useMemo(() => {
    const nodes: Array<{ id: string; isCenter?: boolean; label?: string }> = [
      { id: centerId, isCenter: true },
      ...counterparties.map((c) => ({ id: c.id, label: c.name })),
    ];
    const links: Array<{ source: string; target: string; weight?: number }> =
      counterparties.map((c) => ({
        source: centerId,
        target: c.id,
        weight: c.weight,
      }));

    if (counterparties.length === 0) {
      for (let i = 0; i < 12; i++) {
        nodes.push({ id: `ghost-${i}` });
      }
      for (let i = 0; i < 8; i++) {
        const a = `ghost-${Math.floor(Math.random() * 12)}`;
        const b = `ghost-${Math.floor(Math.random() * 12)}`;
        if (a !== b) links.push({ source: a, target: b, weight: 0.3 });
      }
    }

    return { nodes, links };
  }, [centerId, counterparties]);

  return <NetworkCanvas nodes={nodes} links={links} ambientParticles={counterparties.length > 0} />;
}
