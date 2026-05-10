/** @jsxImportSource react */
import type {ReactNode} from 'react';
import {brandTokens} from '../../brand/tokens';

const W = 1080;
const BAR_H = 14;

const fillGradient = `linear-gradient(90deg, ${brandTokens.gradient[0]} 0%, ${brandTokens.gradient[1]} 100%)`;

/**
 * Step progress after the cover: fill uses `index / (total - 1)` so the first
 * inner slide starts small and the last slide is full (cover excluded).
 */
export function CarouselStepProgress({
  index,
  total,
}: {
  index: number;
  total: number;
}): ReactNode {
  const steps = Math.max(1, total - 1);
  const fillW = Math.max(12, Math.round((W * Math.min(index, steps)) / steps));

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: W,
        height: BAR_H,
        display: 'flex',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: BAR_H,
          display: 'flex',
          background: 'rgba(255,255,255,0.14)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: fillW,
          height: BAR_H,
          display: 'flex',
          background: fillGradient,
        }}
      />
    </div>
  );
}
