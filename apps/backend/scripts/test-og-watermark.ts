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
const OG_WATERMARK_WIDTH = 280;
const OG_BAR_HEIGHT = 160;
const OG_BAR_BLUR = 20;
const OG_BLUR_SIGMA = 30;

const OG_WATERMARK_SVG = `<svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 376.55 61.8">
  <path d="M80.26 6.56v30.71c.46.01.77.35.77.84s-.3.82-.77.84v8.59c1.7 0 3.07 1.37 3.07 3.07h15.99c0-1.7 1.37-3.07 3.07-3.07v-8.61c-.4-.06-.66-.39-.66-.82s.27-.75.66-.82V6.56a3.07 3.07 0 0 1-3.07-3.07H83.33a3.07 3.07 0 0 1-3.07 3.07m20.28 31.55c0 .48-.31.85-.81.85-.47 0-.8-.36-.8-.85s.34-.85.81-.85.79.35.79.85Zm-2.79 0c0 .48-.31.85-.81.85-.47 0-.79-.36-.79-.85s.34-.85.81-.85.79.35.79.85m-2.79 0c0 .48-.31.85-.81.85-.47 0-.79-.36-.79-.85s.34-.85.81-.85.79.35.79.85m-2.79 0c0 .48-.31.85-.81.85-.47 0-.79-.36-.79-.85s.34-.85.81-.85.79.35.79.85m-2.79 0c0 .48-.31.85-.81.85-.47 0-.79-.36-.79-.85s.34-.85.81-.85.79.35.79.85m-2.79 0c0 .48-.31.85-.81.85-.47 0-.79-.36-.79-.85s.34-.85.81-.85.79.35.79.85m-2.79 0c0 .48-.31.85-.81.85-.47 0-.79-.36-.79-.85s.34-.85.81-.85.79.35.79.85M96.43 8.64v9.57h-.74V8.64zm-1.45 0v9.57h-.76V8.64zm-1.47 0v9.57H91.3V8.64zm-2.97 0v9.57h-.71V8.64zm-1.45 0v9.57h-1.47V8.64zm-2.23 0v9.57h-.71V8.64z" fill="#ffffff" fill-rule="evenodd"/>
  <path d="m125.21 13.65-14.4-6.95a3.066 3.066 0 0 1-4.1 1.43l-2.16 4.47v37.12h-2.17c-.5 0-.9.4-.9.9v2.17h-3.6l6.83 3.3a3.066 3.066 0 0 1 4.1-1.43l3.74-7.75c-.33-.23-.43-.64-.24-1.03.19-.4.57-.56.96-.45l13.37-27.67a3.074 3.074 0 0 1-1.43-4.1Zm-18.98 29.28c-.21.44-.65.63-1.1.41-.43-.2-.56-.67-.35-1.11.22-.45.67-.62 1.1-.41.42.21.56.66.35 1.11m8.85-28.45-4.16 8.62-.64-.31 4.16-8.62zm-3.96-1.91.64.31-4.16 8.62-.64-.31zm-2.39 31.57c-.21.44-.65.63-1.1.41-.43-.21-.56-.67-.35-1.11.22-.45.67-.62 1.1-.41.43.2.56.66.35 1.11m-.45-22.31 4.16-8.62 1.33.64-4.16 8.62zm2.96 23.52c-.21.44-.65.63-1.1.41-.43-.21-.56-.67-.35-1.11.22-.45.67-.62 1.1-.41.42.21.56.66.35 1.11m.35-21.92 4.16-8.62 1.99.96-4.16 8.62zm2.63 1.27 4.16-8.62.68.33-4.16 8.62zm1.99.96-.66-.32 4.16-8.62.66.32z" fill-rule="evenodd" fill="#a6165c"/>
  <path d="M14.28 34.95H12.5l-1.72 12.5H.72l5.5-39.33h15.72c8.11 0 13.89 4.33 12.78 13.56-1 7.28-4.11 9.72-9.5 12.28l9.44 13.5H22.27l-8-12.5Zm5.28-8.56c3.06 0 4.83-2.28 5.11-4.56.28-2.39-.89-4.44-3.83-4.44h-5.83l-1.28 9zm34.45-3.05h15.95l-1.22 8.83H52.79l-.83 5.89h17.33l-1.28 9.39H40.62l5.5-39.33h27.39l-1.33 9.39H54.85l-.83 5.83Zm88.78.23h15.95l-1.22 8.83h-15.94l-.83 5.89h17.33l-1.28 9.39h-27.39l5.5-39.33h27.39l-1.33 9.39h-17.33l-.83 5.83Zm28.96-15.22h9.44l7.17 16.78 2.22 7.89.22-.06-.11-6.78 2.5-17.83h9.89l-5.5 39.33h-10.06l-6.72-15.5-2.33-7.89-.22.06.11 7.61-2.17 15.72h-9.94zm56.45 0c7.89 0 14.72 4 13.44 13.17l-1.89 13.22c-1.28 9.06-9.17 12.95-17.06 12.95h-14.72l5.5-39.33h14.72Zm-3.89 30c2.72 0 5.17-1.5 5.45-3.61l1.89-13.22c.28-2.17-1.67-3.89-4.39-3.89h-5.06l-2.95 20.72zm33.06 9.33h-9.94l5.5-39.33h9.94zm16.22-12.44c1.72 2.5 5 3.78 7.94 3.78 2.67 0 5-.94 5.39-3 .44-2.44-3-3.5-6.17-3.94-6.17-1-11.72-5.95-10.33-13.39 1.5-8.06 8.61-10.89 15.83-10.89 4.78 0 9.22 1.33 12.61 6.28l-7.22 5c-1.67-1.89-4.28-2.78-6.56-2.83-2.5-.06-4.61.89-4.83 2.89-.28 2.28 1.72 3.28 4.72 3.94 6.83 1.28 13.5 3.89 11.67 13.67-1.44 7.67-8.11 11.5-16.61 11.5-4.72 0-10.56-2.39-13.56-7.11l7.11-5.89Zm52.4-17.84-4.17 30.28h-10.06l4.17-30.28h-10.61l1.33-9.11h31.28l-1.33 9.11zm27.84 6.17h15.95l-1.22 8.83h-15.94l-.83 5.89h17.33l-1.28 9.39h-27.39l5.5-39.33h27.39l-1.33 9.39h-17.33l-.83 5.83Z" fill="#ffffff"/>
</svg>`;

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

  // Step 3: Frosted-glass bottom bar — blur the bottom strip of the composed image
  // We'll compose the bar after fitting the image, so we need the composed base first
  const composedBase = await sharp(blurredBg)
    .composite([{input: fittedImage, left: leftOffset, top: topOffset}])
    .toBuffer();

  // Extract the bottom strip, blur it, and darken slightly for the frosted look
  const barTop = OG_IMAGE_HEIGHT - OG_BAR_HEIGHT;
  const frostedStrip = await sharp(composedBase)
    .extract({left: 0, top: barTop, width: OG_IMAGE_WIDTH, height: OG_BAR_HEIGHT})
    .blur(OG_BAR_BLUR)
    .modulate({brightness: 0.5, saturation: 0.7})
    .toBuffer();

  // Feather mask: transparent at top, opaque at bottom — so the frosted strip blends in
  const featherMask = Buffer.from(
    `<svg width="${OG_IMAGE_WIDTH}" height="${OG_BAR_HEIGHT}">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="0" />
          <stop offset="35%" stop-color="white" stop-opacity="0.7" />
          <stop offset="100%" stop-color="white" stop-opacity="1" />
        </linearGradient>
      </defs>
      <rect width="${OG_IMAGE_WIDTH}" height="${OG_BAR_HEIGHT}" fill="url(#fade)" />
    </svg>`,
  );

  // Apply the feather mask as alpha to the frosted strip
  const frostedBar = await sharp(frostedStrip)
    .composite([{input: featherMask, blend: 'dest-in'}])
    .toBuffer();

  // Determine logo color from the frosted strip's luminance
  const {dominant} = await sharp(frostedStrip).stats();
  const barLuminance = 0.299 * dominant.r + 0.587 * dominant.g + 0.114 * dominant.b;
  const useDarkLogo = barLuminance > 140;
  console.log(
    `Frosted bar luminance: ${barLuminance.toFixed(0)} → ${useDarkLogo ? 'dark' : 'light'} logo`,
  );

  // Step 4: Watermark — swap to dark text if bar is bright
  let watermarkSvgStr = OG_WATERMARK_SVG;
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
  const result = await sharp(composedBase)
    .composite([
      {input: frostedBar, left: 0, top: barTop},
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
