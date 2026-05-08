/** @jsxImportSource react */
import type {ReactNode} from 'react';
import type {ContentSlide} from '../types';

/**
 * Mid-deck slide: pink badge, big white headline, body copy, footer counter.
 * 1080x1350. Designed for Satori (every multi-child div uses display:flex).
 */
export function ContentSlideTemplate({
  slide,
  index,
  total,
  defaultBadge,
}: {
  slide: ContentSlide;
  index: number;
  total: number;
  defaultBadge?: string;
}): ReactNode {
  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0b0b0c 0%, #1a1020 100%)',
        color: '#fff',
        padding: 72,
        fontFamily: 'Poppins',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 22,
          color: '#ee46a7',
          fontWeight: 700,
          marginBottom: 24,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        {slide.badge ?? defaultBadge ?? 'Revendiste'}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 56,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 32,
        }}
      >
        {slide.title}
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          fontSize: 32,
          lineHeight: 1.45,
          opacity: 0.92,
        }}
      >
        {slide.body}
      </div>
      <div style={{display: 'flex', fontSize: 20, opacity: 0.55}}>
        {index + 1} / {total} · Revendiste
      </div>
    </div>
  );
}
