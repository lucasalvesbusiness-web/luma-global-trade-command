'use client';

import { useMemo } from 'react';

import { NetworkCanvas } from './NetworkCanvas';

/**
 * Landing hero variant: synthetic mesh of 22 nodes + cross-connections
 * to evoke a transactional graph without exposing real company data.
 */
export function LandingNetworkCanvas() {
  const { nodes, links } = useMemo(() => {
    const nodes = Array.from({ length: 22 }, (_, i) => ({
      id: `n${i}`,
      isCenter: i === 0,
    }));
    const links: Array<{ source: string; target: string; weight?: number }> = [];

    // Center connects to first 8 satellites (strong)
    for (let i = 1; i <= 8; i++) {
      links.push({ source: 'n0', target: `n${i}`, weight: 1 + Math.random() * 2 });
    }

    // Random peripheral links to create mesh
    for (let i = 0; i < 28; i++) {
      const a = 1 + Math.floor(Math.random() * 21);
      let b = 1 + Math.floor(Math.random() * 21);
      if (a === b) b = ((b + 3) % 21) + 1;
      links.push({ source: `n${a}`, target: `n${b}`, weight: 0.4 + Math.random() });
    }

    return { nodes, links };
  }, []);

  return <NetworkCanvas nodes={nodes} links={links} />;
}
