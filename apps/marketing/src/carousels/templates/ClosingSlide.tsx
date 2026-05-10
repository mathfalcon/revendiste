/** @jsxImportSource react */
import type {ReactNode} from 'react';
import {brandTokens} from '../../brand/tokens';
import {CarouselStepProgress} from '../components/CarouselStepProgress';
import {
  instagramGlyphSvg,
  tiktokGlyphSvg,
} from '../icons/closingSlideSocialGlyphs';
import {carouselLucideSvg} from '../icons/ContentSlideIcons';

/**
 * Shared last slide for every pinned deck: follow Revendiste on social.
 * Handles match `packages/shared/src/config/social-links.ts`.
 */
export function ClosingSlideTemplate({
  index,
  total,
}: {
  index: number;
  total: number;
}): ReactNode {
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
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 120,
            height: 120,
            borderRadius: 32,
            background: 'rgba(217, 13, 115, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {carouselLucideSvg('sparkles', 62)}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            color: brandTokens.primary,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          Seguinos
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.12,
            maxWidth: 900,
          }}
        >
          Novedades, eventos y tips en tus redes
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
            }}
          >
            {instagramGlyphSvg(44)}
            <div
              style={{
                display: 'flex',
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 1.35,
                color: brandTokens.primary,
              }}
            >
              @revendiste.uy
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
            }}
          >
            {tiktokGlyphSvg(44)}
            <div
              style={{
                display: 'flex',
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 1.35,
                color: brandTokens.primary,
              }}
            >
              @revendiste
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            lineHeight: 1.45,
            opacity: 0.88,
            maxWidth: 880,
          }}
        >
          Así no te perdés lanzamientos, recordatorios y buenas prácticas para
          usar nuestra plataforma
        </div>
      </div>
      <div style={{display: 'flex', fontSize: 20, opacity: 0.55}}>
        Paso {index + 1} de {total} · Revendiste
      </div>
      <CarouselStepProgress index={index} total={total} />
    </div>
  );
}
