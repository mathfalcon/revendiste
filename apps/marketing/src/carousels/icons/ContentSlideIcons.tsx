/** @jsxImportSource react */
import {createElement, type ReactNode} from 'react';
import {brandTokens} from '../../brand/tokens';
import type {ContentSlideIconKey} from '../types';
import {CAROUSEL_LUCIDE_ICON_NODES} from './carouselLucideIconNodes';
import type {LucideCarouselIconNode} from './lucideIconNode';

/**
 * Lucide stroke icons from `lucide-react` `__iconNode` data (same geometry as
 * the web app). Root SVG matches lucide-react defaults: strokeWidth 2, round
 * caps, 24×24 viewBox.
 */

function lucideStrokeSvg(
  nodes: LucideCarouselIconNode,
  color: string,
  size: number,
  strokeWidth = 2,
): ReactNode {
  const sw = strokeWidth;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
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

/**
 * Returns an SVG element subtree for carousel slides.
 *
 * Call this as a plain function inside slide templates (`{carouselLucideSvg(...)}`).
 * Do **not** render `<Foo />` wrappers around icons for Satori — it does not
 * forward props into nested custom components, so props like `name` would be lost.
 */
export function carouselLucideSvg(
  key: ContentSlideIconKey,
  size: number,
): ReactNode {
  const nodes = CAROUSEL_LUCIDE_ICON_NODES[key];
  if (!nodes) {
    throw new Error(
      `carouselLucideSvg: no icon nodes for key ${String(key)} (have keys: ${Object.keys(CAROUSEL_LUCIDE_ICON_NODES).join(', ')})`,
    );
  }
  return lucideStrokeSvg(nodes, brandTokens.primary, size, 2);
}
