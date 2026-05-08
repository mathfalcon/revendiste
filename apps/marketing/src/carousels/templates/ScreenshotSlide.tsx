/** @jsxImportSource react */
import type {ReactNode} from 'react';
import type {ScreenshotSlide as ScreenshotSlideData} from '../types';

/**
 * Inner “screen” size — must match Sharp pre-render in `phone-frame.ts`.
 *
 * The aspect ratio matches the mobile capture viewport (390×844, iPhone 13/14)
 * so screenshots fill edge to edge with no vertical crop.
 */
export const SCREENSHOT_PHONE_INNER_W = 462;
export const SCREENSHOT_PHONE_INNER_H = 1000;

/**
 * Slide that renders a phone-framed screenshot. The phone (bezel + rounded
 * screen) is composited entirely with Sharp before reaching this template,
 * so we just place the resulting PNG as a single `<img>`. This avoids a
 * Satori layout quirk where nested flex children + `<img>` produced a thin
 * black sliver around the screenshot.
 *
 * `frameWidth` / `frameHeight` MUST equal the pixel dimensions of the
 * pre-built PNG (returned by `buildPhoneFramePng`).
 */
export function ScreenshotSlideTemplate({
  slide,
  index,
  total,
  imageDataUrl,
  frameWidth,
  frameHeight,
}: {
  slide: ScreenshotSlideData;
  index: number;
  total: number;
  imageDataUrl: string | null;
  frameWidth: number;
  frameHeight: number;
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
        padding: 60,
        fontFamily: 'Poppins',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 22,
          color: '#ee46a7',
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
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 24,
        }}
      >
        {slide.title}
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            fontSize: 26,
            lineHeight: 1.4,
            opacity: 0.92,
          }}
        >
          {slide.body}
        </div>

        {imageDataUrl ? (
          <img
            src={imageDataUrl}
            alt=''
            width={frameWidth}
            height={frameHeight}
            style={{
              display: 'flex',
              width: frameWidth,
              height: frameHeight,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              width: frameWidth,
              height: frameHeight,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: '#666',
              textAlign: 'center',
              padding: 24,
              borderRadius: 52,
              background: '#101010',
            }}
          >
            Captura no disponible
          </div>
        )}
      </div>

      <div style={{display: 'flex', fontSize: 20, opacity: 0.55, marginTop: 24}}>
        {index + 1} / {total} · Revendiste
      </div>
    </div>
  );
}
