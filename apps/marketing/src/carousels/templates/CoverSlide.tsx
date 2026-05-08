/** @jsxImportSource react */
import {existsSync, readFileSync} from 'node:fs';
import type {ReactNode} from 'react';
import type {CoverSlide as CoverSlideData} from '../types';

/**
 * "Scroll-stopper" cover slide. 1080x1350.
 *
 * If `backgroundImagePath` exists, we embed it as a base64 data URL inside an
 * <img> behind a dark gradient scrim, then overlay the eyebrow + huge title.
 * If not, we fall back to a brand pink→orange gradient — the deck still looks
 * intentional even without external assets.
 */
export function CoverSlideTemplate({
  slide,
  total,
}: {
  slide: CoverSlideData;
  total: number;
}): ReactNode {
  const dataUrl = loadCoverDataUrl(slide.backgroundImagePath);

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        position: 'relative',
        background: dataUrl
          ? '#0b0b0c'
          : 'linear-gradient(135deg, #ff00f8 0%, #de2486 45%, #fe6525 100%)',
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
          background:
            'linear-gradient(180deg, rgba(11,11,12,0.15) 0%, rgba(11,11,12,0.65) 60%, rgba(11,11,12,0.92) 100%)',
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 24,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
            color: '#ee46a7',
          }}
        >
          {slide.eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: -1,
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
              opacity: 0.85,
              maxWidth: 820,
            }}
          >
            {slide.subtitle}
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 20px',
              borderRadius: 999,
              background: '#ee46a7',
              color: '#fff',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Deslizá →
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 20,
              opacity: 0.7,
            }}
          >
            {total} pasos · Revendiste
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
