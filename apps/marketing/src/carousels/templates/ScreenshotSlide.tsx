/** @jsxImportSource react */
import type {ReactNode} from 'react';
import {brandTokens} from '../../brand/tokens';
import {CarouselStepProgress} from '../components/CarouselStepProgress';
import {carouselLucideSvg} from '../icons/ContentSlideIcons';
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
const QR_LAYOUT_IMG_PX = 184;

export function ScreenshotSlideTemplate({
  slide,
  index,
  total,
  imageDataUrl,
  qrDataUrl,
  frameWidth,
  frameHeight,
}: {
  slide: ScreenshotSlideData;
  index: number;
  total: number;
  imageDataUrl: string | null;
  qrDataUrl: string | null;
  frameWidth: number;
  frameHeight: number;
}): ReactNode {
  const isDesktop = slide.presentation === 'desktop';

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
        padding: 60,
        paddingTop: 60 + 14,
        fontFamily: 'Poppins',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {slide.icon ? (
          <div
            style={{
              display: 'flex',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(217, 13, 115, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {carouselLucideSvg(slide.icon, 30)}
          </div>
        ) : null}
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
          {slide.badge}
        </div>
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

      {isDesktop
        ? desktopScreenshotBody({
            body: slide.body,
            qrDataUrl,
            imageDataUrl,
            frameWidth,
            frameHeight,
          })
        : phoneScreenshotBody({
            body: slide.body,
            qrDataUrl,
            imageDataUrl,
            frameWidth,
            frameHeight,
          })}

      <div style={{display: 'flex', fontSize: 20, opacity: 0.55, marginTop: 24}}>
        {`Paso ${index + 1} de ${total} · Revendiste`}
      </div>

      <CarouselStepProgress index={index} total={total} />
    </div>
  );
}

function phoneScreenshotBody({
  body,
  qrDataUrl,
  imageDataUrl,
  frameWidth,
  frameHeight,
}: {
  body: string;
  qrDataUrl: string | null;
  imageDataUrl: string | null;
  frameWidth: number;
  frameHeight: number;
}): ReactNode {
  return (
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
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            lineHeight: 1.4,
            opacity: 0.92,
          }}
        >
          {body}
        </div>
        {qrDataUrl ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: 0,
                background: 'transparent',
              }}
            >
              <img
                src={qrDataUrl}
                alt=''
                width={QR_LAYOUT_IMG_PX}
                height={QR_LAYOUT_IMG_PX}
                style={{
                  display: 'flex',
                  width: QR_LAYOUT_IMG_PX,
                  height: QR_LAYOUT_IMG_PX,
                }}
              />
            </div>
            <div style={{display: 'flex', fontSize: 16, opacity: 0.62, lineHeight: 1.35}}>
              {`Escaneá para abrir en el celular`}
            </div>
          </div>
        ) : null}
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
        screenshotPlaceholder({width: frameWidth, height: frameHeight, radius: 52})
      )}
    </div>
  );
}

function desktopScreenshotBody({
  body,
  qrDataUrl,
  imageDataUrl,
  frameWidth,
  frameHeight,
}: {
  body: string;
  qrDataUrl: string | null;
  imageDataUrl: string | null;
  frameWidth: number;
  frameHeight: number;
}): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: 32,
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          lineHeight: 1.35,
          opacity: 0.9,
          maxWidth: 880,
        }}
      >
        {body}
      </div>

      {qrDataUrl ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: 0,
              background: 'transparent',
              flexShrink: 0,
            }}
          >
            <img
              src={qrDataUrl}
              alt=''
              width={QR_LAYOUT_IMG_PX}
              height={QR_LAYOUT_IMG_PX}
              style={{
                display: 'flex',
                width: QR_LAYOUT_IMG_PX,
                height: QR_LAYOUT_IMG_PX,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              fontSize: 18,
              opacity: 0.65,
              lineHeight: 1.4,
              maxWidth: 420,
            }}
          >
            {`Escaneá para abrir en el celular`}
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          width: frameWidth,
          height: frameHeight,
          borderRadius: 28,
          overflow: 'hidden',
          background: '#101010',
          border: '1px solid rgba(255,255,255,0.16)',
          flexShrink: 0,
        }}
      >
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
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />
        ) : (
          screenshotPlaceholder({width: frameWidth, height: frameHeight, radius: 28})
        )}
      </div>
    </div>
  );
}

function screenshotPlaceholder({
  width,
  height,
  radius,
}: {
  width: number;
  height: number;
  radius: number;
}): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        width,
        height,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        padding: 24,
        borderRadius: radius,
        background: '#101010',
      }}
    >
      Captura no disponible
    </div>
  );
}
