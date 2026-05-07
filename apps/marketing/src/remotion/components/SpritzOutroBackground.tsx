import {AbsoluteFill, Img, staticFile} from 'remotion';

/**
 * Crowd photos under the whole video. `intensity` controls how visible they are
 * (0 = barely-there texture; 1 = full strength on outro).
 * `crossfade` (0..1) crossfades from pink → red.
 */
export function SpritzOutroBackground({
  intensity,
  crossfade,
}: {
  intensity: number;
  crossfade: number;
}) {
  const cover = {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  };

  // Darker wash when intensity is low so type stays readable; lighter when high.
  // Wash bottoms out around 35–55% so the crowd photo is visibly present.
  const washTop = 0.35 + (1 - intensity) * 0.25;
  const washBottom = 0.55 + (1 - intensity) * 0.2;

  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: intensity}}>
      <AbsoluteFill
        style={{
          filter: 'blur(18px)',
          transform: 'scale(1.12)',
        }}
      >
        <Img
          src={staticFile('backgrounds/spritz-outro-crowd-pink.png')}
          style={{...cover, opacity: 1 - crossfade}}
        />
        <Img
          src={staticFile('backgrounds/spritz-outro-crowd-red.png')}
          style={{...cover, opacity: crossfade}}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(11,11,12,${washTop}) 0%, rgba(11,11,12,${washBottom}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
}
