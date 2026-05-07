import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

function spritzHighlightIndex(word: string): number {
  const w = word.trim();
  if (w.length <= 1) {
    return 0;
  }
  if (w.length <= 3) {
    return 1;
  }
  return Math.max(0, Math.ceil(w.length / 2) - 1);
}

export function SpritzWord({
  word,
  primaryColor,
  textColor,
}: {
  word: string;
  primaryColor: string;
  textColor: string;
}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({
    frame,
    fps,
    config: {damping: 14, mass: 0.6},
  });
  const zoom = interpolate(scale, [0, 1], [0.92, 1]);
  const idx = spritzHighlightIndex(word);
  const chars = [...word];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${zoom})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          fontWeight: 800,
          fontSize: 72,
          letterSpacing: '-0.02em',
          textAlign: 'center',
          lineHeight: 1.05,
          maxWidth: '92%',
        }}
      >
        {chars.map((ch, i) => (
          <span
            key={`${word}-${i}`}
            style={{
              color: i === idx ? primaryColor : textColor,
              textShadow:
                i === idx
                  ? `0 0 24px ${primaryColor}55`
                  : '0 2px 24px rgba(0,0,0,0.45)',
            }}
          >
            {ch === ' ' ? '\u00a0' : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
