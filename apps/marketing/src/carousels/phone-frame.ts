/**
 * Build a "phone-framed" PNG with Sharp.
 *
 * We do this in Sharp (not Satori) because Satori does not reliably honor
 * `object-fit` / nested flex sizing on `<img>`, which produced visible gaps
 * between the screenshot and the bezel. Sharp gives us pixel-exact control:
 * we resize the screenshot to the screen, mask it to rounded corners, then
 * composite it onto a bezel rectangle. The output is a single PNG that the
 * Satori slide template renders with one `<img>`.
 */
import sharp from 'sharp';

export type PhoneFrameOptions = {
  /** Inner screen width (px). Aspect ratio 390:844 reads as a real phone. */
  screenW?: number;
  /** Inner screen height (px). */
  screenH?: number;
  /** Bezel thickness (px) wrapped around every side of the screen. */
  bezel?: number;
  /** Inner screen corner radius (px). */
  innerRadius?: number;
  /** Bezel color (hex / rgb). */
  bezelColor?: string;
  /** Optional thin highlight ring outside the bezel. Set to null to disable. */
  highlightColor?: string | null;
  /** Highlight ring width (px). Ignored if highlightColor is null. */
  highlightWidth?: number;
};

const DEFAULTS: Required<
  Omit<PhoneFrameOptions, 'highlightColor'>
> & {highlightColor: string | null} = {
  screenW: 462,
  screenH: 1000,
  bezel: 14,
  innerRadius: 38,
  bezelColor: '#101010',
  highlightColor: 'rgba(255,255,255,0.08)',
  highlightWidth: 6,
};

export type PhoneFramePng = {
  buffer: Buffer;
  width: number;
  height: number;
};

/**
 * @param screenshotPathOrBuffer absolute path or PNG buffer of the raw capture.
 *        It is resized with `cover` to (screenW × screenH).
 */
export async function buildPhoneFramePng(
  screenshotPathOrBuffer: string | Buffer,
  options: PhoneFrameOptions = {},
): Promise<PhoneFramePng> {
  const opts = {...DEFAULTS, ...options};
  const {
    screenW,
    screenH,
    bezel,
    innerRadius,
    bezelColor,
    highlightColor,
    highlightWidth,
  } = opts;

  const outerW = screenW + bezel * 2;
  const outerH = screenH + bezel * 2;
  const ringWidth = highlightColor ? highlightWidth : 0;
  const finalW = outerW + ringWidth * 2;
  const finalH = outerH + ringWidth * 2;
  const outerRadius = innerRadius + bezel;

  // 1) Screenshot → screen-sized PNG cropped to top.
  const screen = await sharp(screenshotPathOrBuffer)
    .resize(screenW, screenH, {fit: 'cover', position: 'top'})
    .png()
    .toBuffer();

  // 2) Round the screen's corners with an SVG mask.
  const screenMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${screenW}" height="${screenH}">
       <rect width="${screenW}" height="${screenH}" rx="${innerRadius}" ry="${innerRadius}" fill="white"/>
     </svg>`,
  );
  const roundedScreen = await sharp(screen)
    .composite([{input: screenMask, blend: 'dest-in'}])
    .png()
    .toBuffer();

  // 3) Bezel rectangle (with optional highlight ring around it).
  // Drawn entirely in SVG so the corners match the screen exactly.
  const ringX = 0;
  const ringY = 0;
  const ringFinalRadius = outerRadius + ringWidth;
  const ringRect = highlightColor
    ? `<rect x="${ringX}" y="${ringY}" width="${finalW}" height="${finalH}" rx="${ringFinalRadius}" ry="${ringFinalRadius}" fill="${highlightColor}"/>`
    : '';
  const bezelRect = `<rect x="${ringWidth}" y="${ringWidth}" width="${outerW}" height="${outerH}" rx="${outerRadius}" ry="${outerRadius}" fill="${bezelColor}"/>`;
  const frameSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${finalW}" height="${finalH}">
       ${ringRect}
       ${bezelRect}
     </svg>`,
  );

  // 4) Compose the rounded screen onto the bezel at (ringWidth + bezel).
  const frame = sharp(frameSvg).png();
  const composited = await frame
    .composite([
      {
        input: roundedScreen,
        top: ringWidth + bezel,
        left: ringWidth + bezel,
      },
    ])
    .png()
    .toBuffer();

  return {
    buffer: composited,
    width: finalW,
    height: finalH,
  };
}
