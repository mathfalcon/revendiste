import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {BrandLogo} from '../components/BrandLogo';
import {SpritzOutroBackground} from '../components/SpritzOutroBackground';
import {SpritzWord} from '../components/SpritzWord';
import {
  buildSpritzSequencePlan,
  type SpritzAdProps,
} from '../computeSpritzDuration';

const bg = '#0b0b0c';
const text = '#ffffff';
const primary = '#ee46a7';

export function SpritzHookAd(props: SpritzAdProps) {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const sequences = buildSpritzSequencePlan(props, fps);
  const lastBeat = sequences[sequences.length - 1];
  const outroStart = lastBeat ? lastBeat.from + lastBeat.durationInFrames : 0;
  const outroFrames = Math.round(props.outroSec * fps);

  // Background lives under the whole composition and fades in across the entire clip.
  // 0% at frame 0 → ~80% by start of outro → 100% during outro.
  const totalFrames = outroStart + outroFrames;
  const intensity = interpolate(
    frame,
    [0, outroStart, totalFrames - 1],
    [0, 0.8, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Slow crossfade from pink → red across the whole clip.
  const crossfade =
    totalFrames > 1
      ? interpolate(frame, [0, totalFrames - 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: bg}} />
      <SpritzOutroBackground intensity={intensity} crossfade={crossfade} />
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 20%, rgba(238,70,167,0.12), transparent 55%)',
        }}
      />
      {sequences.map((s, i) => (
        <Sequence
          key={`${s.word}-${i}`}
          from={s.from}
          durationInFrames={s.durationInFrames}
        >
          {s.kind === 'logo' ? (
            <AbsoluteFill
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BrandLogo width={560} />
            </AbsoluteFill>
          ) : s.kind === 'blank' ? null : (
            <AbsoluteFill>
              <SpritzWord
                word={s.word}
                primaryColor={primary}
                textColor={text}
              />
            </AbsoluteFill>
          )}
        </Sequence>
      ))}
      <Sequence from={outroStart} durationInFrames={outroFrames}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          <BrandLogo width={520} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
