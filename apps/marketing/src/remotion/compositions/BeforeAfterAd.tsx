import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {brandTokens} from '../../brand/tokens';

export function BeforeAfterAd() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = spring({frame, fps, config: {damping: 12}});
  const opacity = interpolate(t, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brandTokens.background,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          fontWeight: 800,
          fontSize: 56,
          color: '#fff',
          textAlign: 'center',
        }}
      >
        Antes / Después
        <div
          style={{
            marginTop: 16,
            fontSize: 22,
            fontWeight: 500,
            color: brandTokens.primary,
          }}
        >
          Plantilla — reemplazá el copy
        </div>
      </div>
    </AbsoluteFill>
  );
}
