import {Composition} from 'remotion';
import {BeforeAfterAd} from './compositions/BeforeAfterAd';
import {SpritzHookAd} from './compositions/SpritzHookAd';
import {
  defaultSpritzProps,
  spritzDurationInFrames,
  type SpritzAdProps,
} from './computeSpritzDuration';

const FPS = 30;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SpritzHookAd"
        component={SpritzHookAd}
        // Initial value (Studio shows this before props are known). The real
        // duration is recomputed per-render in `calculateMetadata` below so
        // briefs of any length render in full.
        durationInFrames={spritzDurationInFrames(defaultSpritzProps, FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultSpritzProps}
        calculateMetadata={({props}) => {
          const fps = FPS;
          return {
            durationInFrames: spritzDurationInFrames(
              props as SpritzAdProps,
              fps,
            ),
            fps,
          };
        }}
      />
      <Composition
        id="BeforeAfterAd"
        component={BeforeAfterAd}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  );
};
