import colors from '../../brand/palettes/colors.json';

export type BrandTokens = typeof colors;

export const brandTokens: BrandTokens = colors;

export function gradientCss(): string {
  const [a, b] = brandTokens.gradient;
  return `linear-gradient(93deg, ${a} -45.88%, ${b} 115.13%)`;
}
