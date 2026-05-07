/** @jsxImportSource react */
import type {ReactNode} from 'react';

export type CarouselSlide = {
  title: string;
  body: string;
  badge?: string;
};

export function HowToSellSlide({
  slide,
  index,
  total,
}: {
  slide: CarouselSlide;
  index: number;
  total: number;
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
        }}
      >
        {slide.badge ?? 'Cómo vender'}
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
