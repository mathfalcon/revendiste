/** @jsxImportSource react */
import type {ReactNode} from 'react';
import type {CarouselSlide} from './HowToSell';
import {HowToSellSlide} from './HowToSell';

export function HowToBuySlide(props: {
  slide: CarouselSlide;
  index: number;
  total: number;
}): ReactNode {
  return (
    <HowToSellSlide
      slide={{...props.slide, badge: props.slide.badge ?? 'Cómo comprar'}}
      index={props.index}
      total={props.total}
    />
  );
}
