import QRCode from 'qrcode';
import {brandTokens} from '../brand/tokens';

/** PNG data URL for Satori `<img src={…}>`. White modules on transparent (dark carousel backgrounds). */
export async function qrCodeToPngDataUrl(
  url: string,
  pixelSize: number,
): Promise<string> {
  return QRCode.toDataURL(url.trim(), {
    type: 'image/png',
    width: pixelSize,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: brandTokens.foreground,
      light: '#00000000',
    },
  });
}
