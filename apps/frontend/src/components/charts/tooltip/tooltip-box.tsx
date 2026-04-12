'use client';

import {type RefObject, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {cn} from '~/lib/utils';

type Props = {
  children: React.ReactNode;
  containerRef: RefObject<HTMLElement | null>;
  containerWidth: number;
  containerHeight: number;
  x: number;
  y: number;
  visible: boolean;
  className?: string;
};

const OFFSET = 14;
const VIEWPORT_PAD = 8;

export function TooltipBox({
  children,
  containerRef,
  containerWidth: _cw,
  containerHeight: _ch,
  x,
  y,
  visible,
  className,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({left: 0, top: 0});

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }
    const root = containerRef.current;
    if (!root) {
      return;
    }
    const rect = root.getBoundingClientRect();
    let left = rect.left + x + OFFSET;
    let top = rect.top + y + OFFSET;

    const boxW = innerRef.current?.offsetWidth ?? 200;
    const boxH = innerRef.current?.offsetHeight ?? 72;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    left = Math.min(left, vw - boxW - VIEWPORT_PAD);
    top = Math.min(top, vh - boxH - VIEWPORT_PAD);
    left = Math.max(VIEWPORT_PAD, left);
    top = Math.max(VIEWPORT_PAD, top);

    setPos({left, top});
  }, [visible, x, y, containerRef, children]);

  if (!visible || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={innerRef}
      className={cn(
        'pointer-events-none fixed z-[100] min-w-[10rem] rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md',
        className,
      )}
      style={{left: pos.left, top: pos.top}}
    >
      {children}
    </div>,
    document.body,
  );
}
