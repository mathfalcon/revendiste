import {useId} from 'react';
import {format, isAfter, isValid, parse, startOfDay} from 'date-fns';
import {es} from 'date-fns/locale';
import {Calendar as CalendarIcon, Clock2Icon} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {Calendar} from '~/components/ui/calendar';
import {Card, CardContent, CardFooter} from '~/components/ui/card';
import {Field, FieldGroup, FieldLabel} from '~/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '~/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {cn} from '~/lib/utils';

const DATETIME_LOCAL = "yyyy-MM-dd'T'HH:mm" as const;

const timeInputChromeless =
  'appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none';

/**
 * Fixed width: `w-max` + `w-full` children resolves to the popper “available” width (~full viewport).
 * `w-72` matches the default popover and keeps the calendar a normal size.
 */
const CALENDAR_POPOVER_CONTENT_CLASS =
  'w-72 max-w-[calc(100vw-1.5rem)] p-0';

function splitDateTimeLocal(value: string): {dateStr: string; timeStr: string} {
  if (!value?.includes('T')) {
    return {dateStr: '', timeStr: '12:00'};
  }
  const [d, t] = value.split('T');
  const raw = t?.slice(0, 5) ?? '';
  const timeStr = /^\d{2}:\d{2}$/.test(raw) ? raw : '12:00';
  return {dateStr: d ?? '', timeStr};
}

function joinDateTimeLocal(dateStr: string, timeStr: string): string {
  if (!dateStr) return '';
  const t = /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : '12:00';
  return `${dateStr}T${t}`;
}

type TimeFieldBlockProps = {
  id: string;
  timeValue: string;
  onTimeChange: (time: string) => void;
  disabled: boolean;
  noDateYet: boolean;
  /** `HH:mm` — native `max` on time input */
  timeMax?: string;
};

function TimeFieldBlock({
  id,
  timeValue,
  onTimeChange,
  disabled,
  noDateYet,
  timeMax,
}: TimeFieldBlockProps) {
  const isDisabled = disabled || noDateYet;
  return (
    <FieldGroup className='gap-4'>
      <Field>
        <FieldLabel htmlFor={id}>Hora</FieldLabel>
        <InputGroup data-disabled={isDisabled ? true : undefined}>
          <InputGroupInput
            id={id}
            type='time'
            step={60}
            max={timeMax}
            value={noDateYet ? '12:00' : timeValue}
            onChange={e => {
              if (noDateYet) return;
              onTimeChange(e.target.value);
            }}
            disabled={isDisabled}
            className={timeInputChromeless}
          />
          <InputGroupAddon align='inline-end'>
            <Clock2Icon className='text-muted-foreground' aria-hidden />
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </FieldGroup>
  );
}

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/** Single form value `yyyy-MM-ddTHH:mm` (same as native datetime-local). */
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Elegí fecha y hora',
  disabled,
  className,
}: DateTimePickerProps) {
  const timeInputId = useId();
  const {dateStr, timeStr} = splitDateTimeLocal(value);
  const selectedDate = dateStr
    ? parse(dateStr, 'yyyy-MM-dd', new Date())
    : undefined;
  const parsedDisplay = value
    ? parse(value, DATETIME_LOCAL, new Date())
    : null;
  const label =
    parsedDisplay && isValid(parsedDisplay)
      ? format(parsedDisplay, "d MMM yyyy, HH:mm", {locale: es})
      : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full pl-3 text-left font-normal',
            !label && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4 shrink-0' aria-hidden />
          {label ?? <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={CALENDAR_POPOVER_CONTENT_CLASS}
        align='start'
      >
        <Card className='w-full gap-0 border-0 py-0 shadow-none'>
          <CardContent className='min-w-0 p-0'>
            <Calendar
              mode='single'
              locale={es}
              className='w-full'
              selected={
                selectedDate && isValid(selectedDate) ? selectedDate : undefined
              }
              onSelect={d => {
                if (!d) {
                  onChange('');
                  return;
                }
                onChange(joinDateTimeLocal(format(d, 'yyyy-MM-dd'), timeStr));
              }}
              defaultMonth={
                selectedDate && isValid(selectedDate) ? selectedDate : new Date()
              }
            />
          </CardContent>
          <CardFooter className='flex-col items-stretch border-t bg-card p-3'>
            <TimeFieldBlock
              id={timeInputId}
              timeValue={timeStr}
              onTimeChange={t => {
                if (!dateStr) return;
                onChange(joinDateTimeLocal(dateStr, t));
              }}
              disabled={Boolean(disabled)}
              noDateYet={!dateStr}
            />
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

type DateAndTimePickerProps = {
  dateValue: string;
  timeValue: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** When true, calendar and time cannot be after the current moment (local). */
  disallowFuture?: boolean;
};

/** Separate `yyyy-MM-dd` and `HH:mm` fields (e.g. settlements). */
export function DateAndTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  placeholder = 'Elegí fecha y hora',
  disabled,
  className,
  disallowFuture,
}: DateAndTimePickerProps) {
  const timeInputId = useId();
  const now = new Date();
  const selectedDate = dateValue
    ? parse(dateValue, 'yyyy-MM-dd', new Date())
    : undefined;
  const timeStr = /^\d{2}:\d{2}$/.test(timeValue) ? timeValue : '12:00';

  const isSelectedDateToday =
    disallowFuture &&
    dateValue &&
    dateValue === format(now, 'yyyy-MM-dd');
  const timeMaxForToday = isSelectedDateToday
    ? format(now, 'HH:mm')
    : undefined;

  const calendarDisabled = disallowFuture
    ? (day: Date) => isAfter(startOfDay(day), startOfDay(now))
    : undefined;
  const label =
    dateValue && selectedDate && isValid(selectedDate)
      ? format(
          parse(`${dateValue}T${timeStr}`, DATETIME_LOCAL, new Date()),
          "d MMM yyyy, HH:mm",
          {locale: es},
        )
      : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full pl-3 text-left font-normal',
            !label && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4 shrink-0' aria-hidden />
          {label ?? <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={CALENDAR_POPOVER_CONTENT_CLASS}
        align='start'
      >
        <Card className='w-full gap-0 border-0 py-0 shadow-none'>
          <CardContent className='min-w-0 p-0'>
            <Calendar
              mode='single'
              locale={es}
              className='w-full'
              disabled={calendarDisabled}
              selected={
                selectedDate && isValid(selectedDate) ? selectedDate : undefined
              }
              onSelect={d => {
                const next = d ? format(d, 'yyyy-MM-dd') : '';
                onDateChange(next);
                if (disallowFuture && d) {
                  const n = new Date();
                  if (next === format(n, 'yyyy-MM-dd')) {
                    const maxT = format(n, 'HH:mm');
                    const currentT = /^\d{2}:\d{2}$/.test(timeValue)
                      ? timeValue
                      : '12:00';
                    if (currentT > maxT) {
                      onTimeChange(maxT);
                    }
                  }
                }
              }}
              defaultMonth={
                selectedDate && isValid(selectedDate)
                  ? selectedDate
                  : disallowFuture
                    ? now
                    : new Date()
              }
            />
          </CardContent>
          <CardFooter className='flex-col items-stretch border-t bg-card p-3'>
            <TimeFieldBlock
              id={timeInputId}
              timeValue={timeStr}
              onTimeChange={onTimeChange}
              disabled={Boolean(disabled)}
              noDateYet={!dateValue}
              timeMax={timeMaxForToday}
            />
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
