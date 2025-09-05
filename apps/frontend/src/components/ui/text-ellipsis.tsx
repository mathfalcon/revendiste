import {cn} from '~/lib/utils';

export interface TextEllipsisProps {
  children: React.ReactNode;
  maxLines?: number;
  className?: string;
  showTooltip?: boolean;
  tooltipContent?: string;
}

export function TextEllipsis({
  children,
  maxLines = 1,
  className,
  showTooltip = true,
  tooltipContent,
}: TextEllipsisProps) {
  // For Tailwind CSS v4, line-clamp utilities are built-in
  // For older versions, we'll use CSS-in-JS as fallback
  const lineClampClass = `line-clamp-${maxLines}`;

  const style =
    maxLines > 1
      ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }
      : {};

  return (
    <p
      className={cn(
        'overflow-hidden',
        maxLines === 1 ? 'truncate' : lineClampClass,
        className,
      )}
      style={style}
      title={
        showTooltip
          ? (tooltipContent ??
            (typeof children === 'string' ? children : undefined))
          : undefined
      }
    >
      {children}
    </p>
  );
}
