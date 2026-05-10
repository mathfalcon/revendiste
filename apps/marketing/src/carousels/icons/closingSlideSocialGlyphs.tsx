/** @jsxImportSource react */
import {createElement, type ReactNode} from 'react';
import type {LucideCarouselIconNode} from './lucideIconNode';

/**
 * Instagram stroke geometry from lucide-react@0.544.0 `instagram` __iconNode
 * (ISC). Rendered white for the closing slide.
 */
const instagramNodes = [
  [
    'rect',
    {
      width: '20',
      height: '20',
      x: '2',
      y: '2',
      rx: '5',
      ry: '5',
      key: '2e1cvw',
    },
  ],
  [
    'path',
    {
      d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z',
      key: '9exkf1',
    },
  ],
  [
    'line',
    {
      x1: '17.5',
      x2: '17.51',
      y1: '6.5',
      y2: '6.5',
      key: 'r4j83e',
    },
  ],
] as const satisfies LucideCarouselIconNode;

function lucideStrokeWhiteSvg(nodes: LucideCarouselIconNode, size: number): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{display: 'flex', flexShrink: 0}}
    >
      {nodes.map((entry, i) => {
        const [tag, attrs] = entry;
        const {key: _k, ...rest} = attrs;
        return createElement(tag, {...rest, key: i});
      })}
    </svg>
  );
}

/** White outline Instagram mark (24×24 viewBox). */
export function instagramGlyphSvg(size: number): ReactNode {
  return lucideStrokeWhiteSvg(instagramNodes, size);
}

/**
 * White filled TikTok mark (24×24). Lucide 0.544 has no TikTok icon; path is a
 * common simplified monochrome glyph used in icon sets.
 */
export function tiktokGlyphSvg(size: number): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#ffffff"
      style={{display: 'flex', flexShrink: 0}}
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.643 2.99 2.99 0 0 1 .878.128V9.397a6.845 6.845 0 0 0-1.018-.076A6.332 6.332 0 0 0 5 20.207a6.339 6.339 0 0 0 10.654-4.631V8.311a8.182 8.182 0 0 0 4.771 1.52V6.289a4.831 4.831 0 0 1-1.836-.06z" />
    </svg>
  );
}
