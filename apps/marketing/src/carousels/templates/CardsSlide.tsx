/** @jsxImportSource react */
import type {ReactNode} from 'react';
import {brandTokens} from '../../brand/tokens';
import {CarouselStepProgress} from '../components/CarouselStepProgress';
import {carouselLucideSvg} from '../icons/ContentSlideIcons';
import type {CardsSlide} from '../types';

/**
 * Icon-backed card grid for principles / trust mechanics. Keeps slides visual
 * when the message is a set of parallel ideas rather than a sequence.
 */
export function CardsSlideTemplate({
  slide,
  index,
  total,
}: {
  slide: CardsSlide;
  index: number;
  total: number;
}): ReactNode {
  const cards = slide.cards.slice(0, 4);

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0b0b0c 0%, #1a1020 100%)',
        color: '#fff',
        padding: 72,
        paddingTop: 72 + 14,
        fontFamily: 'Poppins',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 22,
          color: brandTokens.primary,
          fontWeight: 700,
          marginBottom: 16,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        {slide.badge}
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: slide.intro ? 18 : 42,
        }}
      >
        {slide.title}
      </div>

      {slide.intro ? (
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            lineHeight: 1.4,
            opacity: 0.85,
            marginBottom: 34,
          }}
        >
          {slide.intro}
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 22,
          flex: 1,
          alignContent: 'flex-start',
        }}
      >
        {cards.map((card, i) => (
          <div
            key={`${slide.title}-card-${i}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: cards.length <= 2 ? 452 : 442,
              minHeight: cards.length <= 2 ? 290 : 250,
              padding: 28,
              borderRadius: 32,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 76,
                height: 76,
                borderRadius: 22,
                background: 'rgba(217, 13, 115, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 22,
              }}
            >
              {carouselLucideSvg(card.icon, 40)}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 21,
                lineHeight: 1.35,
                opacity: 0.8,
              }}
            >
              {card.body}
            </div>
          </div>
        ))}
      </div>

      <div style={{display: 'flex', fontSize: 20, opacity: 0.55, marginTop: 24}}>
        Paso {index + 1} de {total} · Revendiste
      </div>

      <CarouselStepProgress index={index} total={total} />
    </div>
  );
}
