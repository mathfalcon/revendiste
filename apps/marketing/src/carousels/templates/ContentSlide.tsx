/** @jsxImportSource react */
import type {ReactNode} from 'react';
import {brandTokens} from '../../brand/tokens';
import {CarouselStepProgress} from '../components/CarouselStepProgress';
import {carouselLucideSvg} from '../icons/ContentSlideIcons';
import type {
  ContentSlide,
  ContentSlideBodyLeadSpan,
  ContentSlideBodyRun,
} from '../types';

/** Word + following whitespace per piece so flex-wrap flows like normal text (Satori has no true inline). */
function bodyRunsToWordPieces(
  runs: ReadonlyArray<ContentSlideBodyRun>,
): {text: string; emphasize: boolean}[] {
  const out: {text: string; emphasize: boolean}[] = [];
  for (const run of runs) {
    const emphasize = !!run.emphasize;
    const leading = run.text.match(/^\s*/)?.[0] ?? '';
    const rest = run.text.slice(leading.length);
    if (leading.length > 0) {
      out.push({text: leading, emphasize});
    }
    const chunks = rest.match(/\S+\s*/g);
    if (chunks) {
      for (const text of chunks) {
        out.push({text, emphasize});
      }
    } else if (rest.length > 0) {
      out.push({text: rest, emphasize});
    }
  }
  return out;
}

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
  const bodyFontSize = 32;
  const bodyLineHeight = 1.45;
  const bodyTextStyle = {
    fontSize: bodyFontSize,
    lineHeight: bodyLineHeight,
    opacity: 0.92,
    fontWeight: 400 as const,
  };

  const bodyRunPxLineHeight = `${bodyFontSize * bodyLineHeight}px`;
  const bodyRunRowStyle = {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'flex-start' as const,
    alignContent: 'flex-start' as const,
    width: '100%' as const,
    minWidth: 0,
    rowGap: 0,
    columnGap: 0,
    fontSize: bodyFontSize,
    lineHeight: bodyRunPxLineHeight,
    opacity: bodyTextStyle.opacity,
    fontWeight: 400 as const,
  };
  const bodyRunChunkStyle = {
    display: 'flex' as const,
    color: '#ffffff',
    fontWeight: 400 as const,
    fontSize: bodyFontSize,
    lineHeight: bodyRunPxLineHeight,
    margin: 0,
    padding: 0,
    /** Trailing spaces in each token are real word separators; flex would collapse them otherwise. */
    whiteSpace: 'pre' as const,
  };

  const bodyRunsBlock =
    slide.bodyRuns && slide.bodyRuns.length > 0 ? (
      <div style={bodyRunRowStyle}>
        {bodyRunsToWordPieces(slide.bodyRuns).map(
          (piece: {text: string; emphasize: boolean}, i: number) => (
            <div
              key={i}
              style={{
                ...bodyRunChunkStyle,
                color: piece.emphasize ? brandTokens.primary : '#ffffff',
              }}
            >
              {piece.text}
            </div>
          ),
        )}
      </div>
    ) : null;

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
      {/* Grow so the step line sits on the bottom padding edge, not under the paragraph. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 28,
            width: '100%',
          }}
        >
          {slide.icon ? (
            <div
              style={{
                display: 'flex',
                width: 108,
                height: 108,
                borderRadius: 28,
                background: 'rgba(217, 13, 115, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {carouselLucideSvg(slide.icon, 56)}
            </div>
          ) : null}
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
                fontSize: 22,
                color: brandTokens.primary,
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
            {bodyRunsBlock ? (
              bodyRunsBlock
            ) : slide.bodyLeadSpans && slide.bodyLeadSpans.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  minWidth: 0,
                  gap: 0,
                }}
              >
                <div style={bodyRunRowStyle}>
                  {slide.bodyLeadSpans.map(
                    (span: ContentSlideBodyLeadSpan, i: number) => {
                      const isLast = i === slide.bodyLeadSpans!.length - 1;
                      const text = isLast ? span.text : `${span.text}\u00A0`;
                      return (
                        <div
                          key={i}
                          style={{
                            ...bodyRunChunkStyle,
                            color: span.emphasize
                              ? brandTokens.primary
                              : '#ffffff',
                          }}
                        >
                          {text}
                        </div>
                      );
                    },
                  )}
                </div>
                <div
                  style={{
                    display: 'block',
                    width: '100%',
                    minWidth: 0,
                    marginTop: -6,
                    paddingTop: 0,
                    ...bodyTextStyle,
                    lineHeight: bodyRunPxLineHeight,
                  }}
                >
                  {` ${slide.body}`}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'block',
                  width: '100%',
                  minWidth: 0,
                  ...bodyTextStyle,
                }}
              >
                {slide.body}
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'block',
          width: '100%',
          flexShrink: 0,
          marginTop: 0,
          fontSize: 20,
          opacity: 0.55,
        }}
      >
        {`Paso ${index + 1} de ${total} · Revendiste`}
      </div>

      <CarouselStepProgress index={index} total={total} />
    </div>
  );
}
