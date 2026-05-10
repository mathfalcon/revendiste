/** @jsxImportSource react */
import type {ReactNode} from 'react';

/**
 * Right chevron for Satori carousels.
 *
 * `lucide-react` icons use `stroke` + open paths; Satori currently drops those
 * from the output SVG, so the glyph never appears. This uses a closed
 * **fill** path (same visual intent as Lucide `ChevronRight`).
 */
export function ChevronRightFilled({
  size = 26,
  color = '#ffffff',
}: {
  size?: number;
  color?: string;
}): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{display: 'flex', flexShrink: 0}}
    >
      <path fill={color} d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}
