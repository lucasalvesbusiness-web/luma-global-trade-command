'use client';

import { useEffect, useRef } from 'react';

type NetworkNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
  isCenter?: boolean;
  label?: string;
};

type NetworkLink = {
  source: number; // index in nodes
  target: number;
  weight: number;
};

type NetworkCanvasProps = {
  nodes: Array<{ id: string; isCenter?: boolean; label?: string; weight?: number }>;
  links: Array<{ source: string; target: string; weight?: number }>;
  className?: string;
  ambientParticles?: boolean;
};

const AMBER = '#C9A968';
const AMBER_GLOW = '#E5C893';
const STEEL = '#7A7A7A';
const DUST = '#D0D0D0';

export function NetworkCanvas({
  nodes: nodesProp,
  links: linksProp,
  className,
  ambientParticles = true,
}: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Build runtime nodes
    const idIndex: Record<string, number> = {};
    const nodes: NetworkNode[] = nodesProp.map((n, i) => {
      idIndex[n.id] = i;
      const isCenter = !!n.isCenter;
      return {
        id: n.id,
        x: isCenter ? width / 2 : Math.random() * width,
        y: isCenter ? height / 2 : Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: isCenter ? 8 : 3 + Math.random() * 2,
        pulse: Math.random() * Math.PI * 2,
        isCenter,
        label: n.label,
      };
    });

    const links: NetworkLink[] = linksProp
      .map((l) => {
        const s = idIndex[l.source];
        const t = idIndex[l.target];
        if (s === undefined || t === undefined) return null;
        return { source: s, target: t, weight: l.weight ?? 1 };
      })
      .filter((x): x is NetworkLink => x !== null);

    // Particles flowing along links
    type Particle = { linkIdx: number; t: number; speed: number };
    const particleCount = ambientParticles ? Math.min(40, links.length * 2) : 0;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      linkIdx: Math.floor(Math.random() * Math.max(1, links.length)),
      t: Math.random(),
      speed: 0.0008 + Math.random() * 0.0012,
    }));

    let raf = 0;
    let last = performance.now();

    function step(now: number) {
      const dt = Math.min(50, now - last);
      last = now;

      // Force-directed: very gentle attraction along links + repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        if (a.isCenter) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist2 = dx * dx + dy * dy + 0.01;
          const dist = Math.sqrt(dist2);
          // Repulsion
          const rep = 200 / dist2;
          a.vx -= (dx / dist) * rep * 0.001 * dt;
          a.vy -= (dy / dist) * rep * 0.001 * dt;
          if (!b.isCenter) {
            b.vx += (dx / dist) * rep * 0.001 * dt;
            b.vy += (dy / dist) * rep * 0.001 * dt;
          }
        }
      }

      for (const link of links) {
        const a = nodes[link.source]!;
        const b = nodes[link.target]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const target = 140;
        const f = (dist - target) * 0.0001 * dt;
        if (!a.isCenter) {
          a.vx += (dx / dist) * f;
          a.vy += (dy / dist) * f;
        }
        if (!b.isCenter) {
          b.vx -= (dx / dist) * f;
          b.vy -= (dy / dist) * f;
        }
      }

      // Center attraction (gentle)
      for (const n of nodes) {
        if (n.isCenter) continue;
        n.vx += (width / 2 - n.x) * 0.0000015 * dt;
        n.vy += (height / 2 - n.y) * 0.0000015 * dt;
        n.vx *= 0.96;
        n.vy *= 0.96;
        n.x += n.vx * dt * 0.05;
        n.y += n.vy * dt * 0.05;
        // soft bounds
        if (n.x < 20) n.x = 20;
        if (n.x > width - 20) n.x = width - 20;
        if (n.y < 20) n.y = 20;
        if (n.y > height - 20) n.y = height - 20;
        n.pulse += 0.002 * dt;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw links
      for (const link of links) {
        const a = nodes[link.source]!;
        const b = nodes[link.target]!;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(160,160,160,${0.08 + link.weight * 0.04})`;
        ctx.lineWidth = 0.5 + Math.min(2, link.weight * 0.4);
        ctx.stroke();
      }

      // Draw particles
      if (ambientParticles && links.length > 0) {
        for (const p of particles) {
          p.t += p.speed * dt;
          if (p.t > 1) {
            p.t = 0;
            p.linkIdx = Math.floor(Math.random() * links.length);
          }
          const link = links[p.linkIdx]!;
          const a = nodes[link.source]!;
          const b = nodes[link.target]!;
          const px = a.x + (b.x - a.x) * p.t;
          const py = a.y + (b.y - a.y) * p.t;
          ctx.beginPath();
          ctx.arc(px, py, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = AMBER_GLOW;
          ctx.shadowColor = AMBER;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const pulseOpacity = 0.55 + Math.sin(n.pulse) * 0.25;
        if (n.isCenter) {
          // Halo
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 28);
          grad.addColorStop(0, `rgba(229,200,147,${0.35 * pulseOpacity})`);
          grad.addColorStop(1, 'rgba(229,200,147,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 28, 0, Math.PI * 2);
          ctx.fill();
          // Core
          ctx.fillStyle = AMBER_GLOW;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = DUST;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          // Faint ring
          ctx.strokeStyle = `rgba(122,122,122,0.4)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Side prevent: silence unused var lint
      void STEEL;

      if (!reduce) raf = requestAnimationFrame(step);
    }

    if (!reduce) {
      raf = requestAnimationFrame(step);
    } else {
      // Render once, static.
      step(performance.now());
    }

    function onResize() {
      resize();
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [nodesProp, linksProp, ambientParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'absolute inset-0 h-full w-full'}
      aria-hidden
    />
  );
}
