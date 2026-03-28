/**
 * Quick test script to preview what the OG watermark looks like.
 * Usage: npx tsx scripts/test-og-watermark.ts [image-url-or-path]
 *
 * If no argument provided, downloads a sample event image from the CDN.
 * Output: ./test-og-output.jpg
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const OG_WATERMARK_WIDTH = 180;
const OG_BAR_HEIGHT = 96;
const OG_BAR_ALPHA = 0.9;
const OG_BLUR_SIGMA = 30;

async function main() {
  const input = process.argv[2];
  let sourceBuffer: Buffer;

  if (input && !input.startsWith('http')) {
    sourceBuffer = fs.readFileSync(input);
    console.log(`Loaded local file: ${input}`);
  } else {
    const url =
      input || 'https://cdn.revendiste.com/assets/default-og-image.jpg';
    console.log(`Downloading: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    sourceBuffer = Buffer.from(await res.arrayBuffer());
  }

  const sourceMeta = await sharp(sourceBuffer).metadata();
  console.log(
    `Source image: ${sourceMeta.width}x${sourceMeta.height} (${sourceMeta.format})`,
  );

  // Step 1: Blurred background
  const blurredBg = await sharp(sourceBuffer)
    .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .blur(OG_BLUR_SIGMA)
    .modulate({brightness: 0.6})
    .toBuffer();

  // Step 2: Fitted image (no crop)
  const fittedImage = await sharp(sourceBuffer)
    .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: false,
    })
    .toBuffer();

  const fittedMeta = await sharp(fittedImage).metadata();
  const fittedWidth = fittedMeta.width || OG_IMAGE_WIDTH;
  const fittedHeight = fittedMeta.height || OG_IMAGE_HEIGHT;
  const leftOffset = Math.round((OG_IMAGE_WIDTH - fittedWidth) / 2);
  const topOffset = Math.round((OG_IMAGE_HEIGHT - fittedHeight) / 2);

  console.log(`Fitted to: ${fittedWidth}x${fittedHeight}`);
  console.log(`Position: left=${leftOffset}, top=${topOffset}`);

  // Step 3: Bottom bar — uses dominant color from source image, darkened
  const {dominant} = await sharp(sourceBuffer).stats();
  const barR = Math.round(dominant.r * 0.4);
  const barG = Math.round(dominant.g * 0.4);
  const barB = Math.round(dominant.b * 0.4);
  const barLuminance = 0.299 * barR + 0.587 * barG + 0.114 * barB;
  const useDarkLogo = barLuminance > 120;
  console.log(
    `Dominant color: rgb(${dominant.r},${dominant.g},${dominant.b}) → bar: rgb(${barR},${barG},${barB}) luminance=${barLuminance.toFixed(0)} → ${useDarkLogo ? 'dark' : 'light'} logo`,
  );

  const barSvg = Buffer.from(
    `<svg width="${OG_IMAGE_WIDTH}" height="${OG_BAR_HEIGHT}">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgb(${barR},${barG},${barB})" stop-opacity="0" />
          <stop offset="30%" stop-color="rgb(${barR},${barG},${barB})" stop-opacity="0.4" />
          <stop offset="50%" stop-color="rgb(${barR},${barG},${barB})" stop-opacity="${OG_BAR_ALPHA}" />
          <stop offset="100%" stop-color="rgb(${barR},${barG},${barB})" stop-opacity="1" />
        </linearGradient>
      </defs>
      <rect width="${OG_IMAGE_WIDTH}" height="${OG_BAR_HEIGHT}" fill="url(#fade)" />
    </svg>`,
  );

  // Step 4: Watermark — swap to dark text if bar is bright
  const watermarkPath = path.resolve(
    __dirname,
    '../src/assets/og-watermark.svg',
  );
  let watermarkSvgStr = fs.readFileSync(watermarkPath, 'utf-8');
  if (useDarkLogo) {
    watermarkSvgStr = watermarkSvgStr.replace(/#ffffff/gi, '#000000');
  }
  const watermarkSvg = Buffer.from(watermarkSvgStr);

  const resizedWatermark = await sharp(watermarkSvg)
    .resize(OG_WATERMARK_WIDTH, OG_BAR_HEIGHT - 16, {fit: 'inside'})
    .toBuffer();

  const wmMeta = await sharp(resizedWatermark).metadata();
  const wmWidth = wmMeta.width || OG_WATERMARK_WIDTH;
  const wmHeight = wmMeta.height || OG_BAR_HEIGHT - 16;
  const wmLeft = Math.round((OG_IMAGE_WIDTH - wmWidth) / 2);
  const wmBottomPadding = 12;
  const wmTop = OG_IMAGE_HEIGHT - wmHeight - wmBottomPadding;

  console.log(`Watermark: ${wmWidth}x${wmHeight} at left=${wmLeft}, top=${wmTop}`);

  // Step 5: Compose
  const result = await sharp(blurredBg)
    .composite([
      {input: fittedImage, left: leftOffset, top: topOffset},
      {input: barSvg, left: 0, top: OG_IMAGE_HEIGHT - OG_BAR_HEIGHT},
      {input: resizedWatermark, left: wmLeft, top: wmTop},
    ])
    .jpeg({quality: 85})
    .toBuffer();

  const outputPath = path.resolve(__dirname, '../test-og-output.jpg');
  fs.writeFileSync(outputPath, result);
  console.log(`\nDone! Preview saved to: ${outputPath}`);
  console.log(`Size: ${(result.length / 1024).toFixed(1)} KB`);
  console.log(`Dimensions: ${OG_IMAGE_WIDTH}x${OG_IMAGE_HEIGHT}`);
}

main().catch(console.error);
