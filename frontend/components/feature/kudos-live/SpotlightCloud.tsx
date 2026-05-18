// "use client": dynamically loaded; renders the SVG-style word cloud.
// We intentionally avoid pulling in a heavy library (d3-cloud) for MVP —
// instead we lay nodes out by weight in a tasteful flex grid with size
// derived from count. This keeps the bundle minimal while still providing
// the visual + a11y parallel list required by the spec.
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { SpotlightNode } from '@/lib/api/kudos/types';

interface SpotlightCloudProps {
  nodes: SpotlightNode[];
  emptyLabel: string;
}

function sizeFor(count: number, max: number): string {
  if (max <= 0) return '14px';
  const ratio = count / max;
  if (ratio > 0.8) return '32px';
  if (ratio > 0.6) return '26px';
  if (ratio > 0.4) return '22px';
  if (ratio > 0.2) return '18px';
  return '14px';
}

function colorFor(count: number, max: number): string {
  if (max <= 0) return 'rgba(255, 234, 158, 0.6)';
  const ratio = count / max;
  if (ratio > 0.6) return '#FFEA9E';
  if (ratio > 0.3) return 'rgba(255, 234, 158, 0.85)';
  return 'rgba(255, 234, 158, 0.55)';
}

export default function SpotlightCloud({ nodes, emptyLabel }: SpotlightCloudProps) {
  const max = useMemo(() => nodes.reduce((m, n) => Math.max(m, n.count), 0), [
    nodes,
  ]);

  if (nodes.length === 0) {
    return (
      <p
        role="status"
        className="font-montserrat text-[14px] font-medium text-white/60"
      >
        {emptyLabel}
      </p>
    );
  }

  return (
    <>
      {/* Visual cloud */}
      <div
        aria-hidden="true"
        className="flex w-full max-w-[1024px] flex-row flex-wrap items-center justify-center gap-x-[24px] gap-y-[12px] px-[24px] py-[24px]"
      >
        {nodes.slice(0, 200).map((n) => (
          <Link
            key={n.user_id}
            href={`/kudos?receiver=${n.user_id}`}
            className="inline-flex font-montserrat font-bold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
            style={{
              fontSize: sizeFor(n.count, max),
              color: colorFor(n.count, max),
            }}
            title={`${n.full_name} · ${n.count}`}
          >
            {n.full_name}
          </Link>
        ))}
      </div>
      {/* SR-only parallel list. Mirrors the visual cloud target so screen
          readers route to the same filtered feed instead of the
          not-yet-shipped /users/[id] page. */}
      <ul className="sr-only">
        {nodes.map((n) => (
          <li key={`${n.user_id}-sr`}>
            <Link href={`/kudos?receiver=${n.user_id}`}>
              {n.full_name} — {n.count}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
