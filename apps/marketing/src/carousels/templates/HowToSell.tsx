/** @jsxImportSource react */
/**
 * Backward-compat shim. The renderer now dispatches on `slide.kind` and uses
 * `ContentSlideTemplate` directly. This file exists so existing imports
 * (and any external callers) keep working.
 */
import type {ReactNode} from 'react';
import type {ContentSlide} from '../types';
import {ContentSlideTemplate} from './ContentSlide';

export type {ContentSlide as CarouselSlide};

export function HowToSellSlide(props: {
  slide: ContentSlide;
  index: number;
  total: number;
}): ReactNode {
  return (
    <ContentSlideTemplate
      slide={props.slide}
      index={props.index}
      total={props.total}
      defaultBadge='Cómo vender'
    />
  );
}
