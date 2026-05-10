/** @jsxImportSource react */
import {existsSync, readFileSync} from 'node:fs';
import type {ReactNode} from 'react';
import {brandTokens} from '../../brand/tokens';
import {ChevronRightFilled} from '../icons/ChevronRightFilled';
import type {CoverSlide as CoverSlideData} from '../types';

const [g0, g1] = brandTokens.gradient;
const coverFallbackGradient = `linear-gradient(135deg, ${g0} 0%, ${brandTokens.primary} 45%, ${g1} 100%)`;

/**
 * "Scroll-stopper" cover slide. 1080x1350.
 *
 * If `backgroundImagePath` exists, we embed it as a base64 data URL inside an
 * <img> behind a dark gradient scrim, then overlay the eyebrow + huge title.
 * If not, we fall back to a brand pink→orange gradient — the deck still looks
 * intentional even without external assets.
 */
export function CoverSlideTemplate({slide}: {slide: CoverSlideData}): ReactNode {
  const dataUrl = loadCoverDataUrl(slide.backgroundImagePath);
  const eyebrowRuleWidth = Math.min(
    920,
    Math.max(140, Math.round(slide.eyebrow.length * 20)),
  );
  const scrim = dataUrl
    ? 'linear-gradient(180deg, rgba(11,11,12,0.22) 0%, rgba(11,11,12,0.55) 42%, rgba(11,11,12,0.94) 100%)'
    : 'linear-gradient(180deg, rgba(11,11,12,0.15) 0%, rgba(11,11,12,0.65) 60%, rgba(11,11,12,0.92) 100%)';

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        position: 'relative',
        background: dataUrl ? brandTokens.background : coverFallbackGradient,
        color: '#fff',
        fontFamily: 'Poppins',
        overflow: 'hidden',
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          width={1080}
          height={1350}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            objectFit: 'cover',
          }}
        />
      ) : null}

      {/* Dark scrim — keeps text legible over any cover image */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1350,
          display: 'flex',
          background: scrim,
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          width: 1080,
          height: 1350,
          padding: 72,
          gap: 24,
        }}
      >
        {/* Eyebrow: editorial “kicker” — white type + shadow + thin brand rule (no chip box) */}
        {/* Column uses default alignItems: stretch so the rule keeps real width in Satori (percent widths under alignItems:flex-start often collapse to 0). */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'flex-start',
            gap: 14,
            maxWidth: 920,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 3.5,
              color: brandTokens.foreground,
              textShadow: dataUrl
                ? '0 1px 3px rgba(0,0,0,0.95), 0 0 28px rgba(11,11,12,0.9), 0 8px 32px rgba(0,0,0,0.65)'
                : '0 2px 8px rgba(11,11,12,0.45)',
            }}
          >
            {slide.eyebrow}
          </div>
          <div
            style={{
              display: 'flex',
              width: eyebrowRuleWidth,
              height: 5,
              borderRadius: 2,
              background: brandTokens.primary,
              boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: -1,
            color: brandTokens.foreground,
            textShadow: dataUrl
              ? '0 2px 16px rgba(0,0,0,0.75), 0 4px 40px rgba(11,11,12,0.55)'
              : '0 2px 12px rgba(11,11,12,0.35)',
          }}
        >
          {slide.title}
        </div>
        {slide.subtitle ? (
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.3,
              opacity: 0.92,
              maxWidth: 820,
              color: brandTokens.foreground,
              textShadow: dataUrl
                ? '0 1px 8px rgba(0,0,0,0.8), 0 4px 24px rgba(11,11,12,0.5)'
                : '0 2px 8px rgba(11,11,12,0.35)',
            }}
          >
            {slide.subtitle}
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '22px 72px',
              borderRadius: 999,
              background: brandTokens.primary,
              color: '#fff',
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 0.3,
              maxWidth: 936,
            }}
          >
            <span style={{display: 'flex', textAlign: 'center'}}>
              Deslizá para saber más
            </span>
            <ChevronRightFilled size={32} color="#ffffff" />
          </div>
        </div>
      </div>
    </div>
  );
}

function loadCoverDataUrl(filePath?: string): string | null {
  if (!filePath || !existsSync(filePath)) {
    return null;
  }
  try {
    const ext = filePath.toLowerCase().split('.').pop() ?? 'png';
    const mime =
      ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/png';
    const buf = readFileSync(filePath);
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}
