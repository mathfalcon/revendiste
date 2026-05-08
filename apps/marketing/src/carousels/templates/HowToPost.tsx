/** @jsxImportSource react */
import type {ReactNode} from 'react';
import type {ContentSlide} from '../types';
import {ContentSlideTemplate} from './ContentSlide';

export function HowToPostSlide(props: {
  slide: ContentSlide;
  index: number;
  total: number;
}): ReactNode {
  return (
    <ContentSlideTemplate
      slide={props.slide}
      index={props.index}
      total={props.total}
      defaultBadge='Cómo publicar'
    />
  );
}
