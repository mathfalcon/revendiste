'use client';

export type TooltipRow = {
  color: string;
  label: string;
  value: string;
};

type Props = {
  title?: string;
  rows: TooltipRow[];
};

export function TooltipContent({title, rows}: Props) {
  return (
    <div className='space-y-2'>
      {title ? (
        <p className='font-medium leading-none text-foreground'>{title}</p>
      ) : null}
      <div className='grid gap-1.5'>
        {rows.map(row => (
          <div
            key={`${row.label}-${row.value}`}
            className='flex items-center justify-between gap-4'
          >
            <span className='flex items-center gap-2 text-muted-foreground'>
              <span
                aria-hidden
                className='h-2 w-2 shrink-0 rounded-[2px]'
                style={{backgroundColor: row.color}}
              />
              {row.label}
            </span>
            <span className='font-mono font-medium tabular-nums text-foreground'>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
