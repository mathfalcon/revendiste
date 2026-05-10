/** @jsxImportSource react */
import type {ReactNode} from 'react';
import {brandTokens} from '../../brand/tokens';
import {CarouselStepProgress} from '../components/CarouselStepProgress';
import {carouselLucideSvg} from '../icons/ContentSlideIcons';
import type {StepperSlide} from '../types';

/**
 * Vertical numbered stepper slide. 1080×1350.
 *
 * Each step renders a circular brand-tinted index, an icon glyph, and a one-
 * line label. Designed for short flows (3–6 steps); we cap the visible count
 * defensively so layout stays readable.
 */
export function StepperSlideTemplate({
  slide,
  index,
  total,
}: {
  slide: StepperSlide;
  index: number;
  total: number;
}): ReactNode {
  const steps = slide.steps.slice(0, 8);

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
          marginBottom: slide.intro ? 18 : 36,
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
            marginBottom: 36,
          }}
        >
          {slide.intro}
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          gap: 22,
        }}
      >
        {steps.map((step, i) => (
          <div
            key={`${slide.title}-step-${i}`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 22,
            }}
          >
            {/* Large icon tile; small step index overlapped bottom-right. */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                width: 100,
                height: 100,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 100,
                  height: 100,
                  borderRadius: 28,
                  background: 'rgba(217, 13, 115, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {carouselLucideSvg(step.icon, 52)}
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  display: 'flex',
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: brandTokens.primary,
                  color: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                  fontWeight: 800,
                  border: '2px solid #0b0b0c',
                }}
              >
                {i + 1}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {step.label}
              </div>
              {step.detail ? (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 20,
                    opacity: 0.7,
                    marginTop: 4,
                  }}
                >
                  {step.detail}
                </div>
              ) : null}
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
