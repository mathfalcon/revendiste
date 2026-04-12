import {useEffect, useState} from 'react';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {endOfDay, startOfDay} from 'date-fns';
import type {DateRange} from 'react-day-picker';
import {CalendarIcon} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {Calendar} from '~/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {cn} from '~/lib/utils';
import type {DashboardSearch} from './dashboard-params';

const PRESETS: {key: DashboardSearch['periodo']; label: string}[] = [
  {key: 'hoy', label: 'Hoy'},
  {key: '7d', label: '7 días'},
  {key: '30d', label: '30 días'},
  {key: 'todo', label: 'Todo'},
];

type Props = {
  search: DashboardSearch;
  onChangePreset: (periodo: DashboardSearch['periodo']) => void;
  onChangeRange: (desde: string, hasta: string) => void;
};

export function DashboardPeriodSelector({
  search,
  onChangePreset,
  onChangeRange,
}: Props) {
  const isCustom = Boolean(search.desde && search.hasta);
  const [rangeDraft, setRangeDraft] = useState<DateRange | undefined>(() =>
    search.desde && search.hasta
      ? {
          from: new Date(search.desde),
          to: new Date(search.hasta),
        }
      : undefined,
  );

  useEffect(() => {
    if (search.desde && search.hasta) {
      setRangeDraft({
        from: new Date(search.desde),
        to: new Date(search.hasta),
      });
    } else {
      setRangeDraft(undefined);
    }
  }, [search.desde, search.hasta]);

  const customLabel =
    isCustom && search.desde && search.hasta
      ? `${format(new Date(search.desde), 'd MMM', {locale: es})} – ${format(
          new Date(search.hasta),
          'd MMM yyyy',
          {locale: es},
        )}`
      : 'Personalizado';

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {PRESETS.map(({key, label}) => (
        <Button
          key={key}
          type='button'
          variant={!isCustom && search.periodo === key ? 'default' : 'outline'}
          size='sm'
          className='cursor-pointer'
          onClick={() => onChangePreset(key)}
        >
          {label}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant={isCustom ? 'default' : 'outline'}
            size='sm'
            className={cn(
              'cursor-pointer min-w-40 justify-start text-left font-normal',
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' aria-hidden />
            {customLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-72 max-w-[calc(100vw-1.5rem)] p-0 md:w-[36rem]'
          align='start'
        >
          <Calendar
            mode='range'
            defaultMonth={rangeDraft?.from}
            selected={rangeDraft}
            onSelect={range => {
              setRangeDraft(range);
              if (range?.from && range?.to) {
                const desde = startOfDay(range.from).toISOString();
                const hasta = endOfDay(range.to).toISOString();
                onChangeRange(desde, hasta);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
