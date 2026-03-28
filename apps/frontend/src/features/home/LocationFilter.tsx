import {useEffect, useMemo, useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {getRegionsQuery} from '~/lib';
import {useGeolocation} from '~/hooks';
import {
  Navigation,
  Loader2,
  MapPin,
  Calendar,
  Ticket,
  Check,
  ChevronDown,
  X,
} from 'lucide-react';
import {cn} from '~/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {Separator} from '~/components/ui/separator';
import {
  addDays,
  endOfMonth,
  format,
  startOfMonth,
  nextFriday,
  nextSunday,
  isFriday,
  isSaturday,
  isSunday,
} from 'date-fns';

export interface LocationFilter {
  type: 'all' | 'nearby' | 'region';
  regions?: string[];
  lat?: number;
  lng?: number;
  dateFrom?: string;
  dateTo?: string;
  hasTickets?: boolean;
}

interface LocationFilterProps {
  value: LocationFilter;
  onChange: (filter: LocationFilter) => void;
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
}

function formatRegionName(region: string): string {
  return region
    .replace(/^Departamento de /i, '')
    .replace(/^Provincia de /i, '')
    .trim();
}

interface DatePreset {
  label: string;
  from: string;
  to: string;
}

function getDatePresets(): DatePreset[] {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');

  // Weekend = Friday to Sunday. If we're already in the weekend, start from today.
  const isWeekend = isFriday(now) || isSaturday(now) || isSunday(now);
  const weekendStart = isWeekend ? today : format(nextFriday(now), 'yyyy-MM-dd');
  const weekendEnd = isSunday(now) ? today : format(nextSunday(now), 'yyyy-MM-dd');

  return [
    {label: 'Hoy', from: today, to: today},
    {label: 'Mañana', from: tomorrow, to: tomorrow},
    {label: 'Este finde', from: weekendStart, to: weekendEnd},
    {label: 'Este mes', from: monthStart, to: monthEnd},
  ];
}

function getDateLabel(dateFrom?: string, dateTo?: string): string | null {
  if (!dateFrom && !dateTo) return null;
  const presets = getDatePresets();
  const match = presets.find(p => p.from === dateFrom && p.to === dateTo);
  if (match) return match.label;
  if (dateFrom && dateTo && dateFrom !== dateTo) {
    return `${format(new Date(dateFrom), 'dd/MM')} - ${format(new Date(dateTo), 'dd/MM')}`;
  }
  if (dateFrom) return format(new Date(dateFrom), 'dd/MM');
  return null;
}

export const LocationFilterBar = ({value, onChange, scrollTargetRef}: LocationFilterProps) => {
  const {data: regionData} = useQuery(getRegionsQuery());
  const {status: geoStatus, coords, requestLocation} = useGeolocation();
  const pendingNearbyRef = useRef(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const scrollIntoView = () => {
    scrollTargetRef?.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  useEffect(() => {
    if (pendingNearbyRef.current && geoStatus === 'granted' && coords) {
      pendingNearbyRef.current = false;
      onChange({...value, type: 'nearby', lat: coords.lat, lng: coords.lng});
      setRegionOpen(false);
      scrollIntoView();
    }
    if (geoStatus === 'denied') {
      pendingNearbyRef.current = false;
    }
  }, [geoStatus, coords, onChange, value]);

  const handleNearbyClick = () => {
    if (value.type === 'nearby') {
      onChange({...value, type: 'all', lat: undefined, lng: undefined});
      scrollIntoView();
      return;
    }
    if (coords) {
      onChange({...value, type: 'nearby', lat: coords.lat, lng: coords.lng});
      setRegionOpen(false);
      scrollIntoView();
      return;
    }
    pendingNearbyRef.current = true;
    requestLocation();
  };

  const regionOptions = useMemo(
    () =>
      regionData?.flatMap(group =>
        group.regions.map(r => ({value: r, label: formatRegionName(r)})),
      ) ?? [],
    [regionData],
  );

  const handleRegionToggle = (region: string) => {
    const current = value.regions ?? [];
    const updated = current.includes(region)
      ? current.filter(r => r !== region)
      : [...current, region];
    if (updated.length === 0) {
      onChange({...value, type: 'all', regions: undefined});
    } else {
      onChange({...value, type: 'region', regions: updated});
    }
  };

  const handleDatePreset = (preset: DatePreset) => {
    if (value.dateFrom === preset.from && value.dateTo === preset.to) {
      onChange({...value, dateFrom: undefined, dateTo: undefined});
    } else {
      onChange({...value, dateFrom: preset.from, dateTo: preset.to});
    }
    setDateOpen(false);
    scrollIntoView();
  };

  const handleClearDate = () => {
    onChange({...value, dateFrom: undefined, dateTo: undefined});
    scrollIntoView();
  };

  const handleToggleHasTickets = () => {
    onChange({...value, hasTickets: value.hasTickets ? undefined : true});
    scrollIntoView();
  };

  const isNearbyLoading = geoStatus === 'loading';
  const selectedRegions = value.regions ?? [];
  const hasRegionFilter = value.type === 'region' && selectedRegions.length > 0;
  const hasLocationFilter = value.type === 'nearby' || hasRegionFilter;
  const hasDateFilter = !!value.dateFrom || !!value.dateTo;
  const isAllActive = value.type === 'all' && !hasDateFilter && !value.hasTickets;
  const hasAnyFilter = !isAllActive;

  const locationLabel = (() => {
    if (value.type === 'nearby') return 'Cerca de mí';
    if (hasRegionFilter) {
      return selectedRegions.length === 1
        ? formatRegionName(selectedRegions[0]!)
        : `${selectedRegions.length} zonas`;
    }
    return 'Ubicación';
  })();

  const dateLabel = getDateLabel(value.dateFrom, value.dateTo) ?? 'Fecha';
  const datePresets = getDatePresets();

  return (
    <div>
      <div className='flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5'>

        {/* Todos */}
        <FilterPill
          active={isAllActive}
          onClick={() => {
            onChange({type: 'all'});
            scrollIntoView();
          }}
        >
          Todos
        </FilterPill>

        {/* Fecha */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              className={cn(pillBase, hasDateFilter ? pillActive : pillInactive)}
            >
              <Calendar className='size-3.5' />
              {dateLabel}
              {hasDateFilter ? (
                <span
                  role='button'
                  onClick={e => {
                    e.stopPropagation();
                    handleClearDate();
                  }}
                  className='ml-0.5 rounded-full hover:bg-primary-foreground/20 p-0.5'
                >
                  <X className='size-3' />
                </span>
              ) : (
                <ChevronDown className='size-3' />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-44 p-1' align='start'>
            {datePresets.map(preset => {
              const isActive =
                value.dateFrom === preset.from && value.dateTo === preset.to;
              return (
                <button
                  key={preset.label}
                  type='button'
                  onClick={() => handleDatePreset(preset)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-sm cursor-pointer',
                    isActive ? 'bg-accent font-medium' : 'hover:bg-accent',
                  )}
                >
                  {preset.label}
                  {isActive && <Check className='size-3.5' />}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        {/* Con entradas */}
        <FilterPill
          active={!!value.hasTickets}
          onClick={handleToggleHasTickets}
          icon={<Ticket className='size-3.5' />}
        >
          Con entradas
        </FilterPill>

        {/* Ubicación pill — includes "Cerca de mí" + regions */}
        <Popover open={regionOpen} onOpenChange={setRegionOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              className={cn(pillBase, hasLocationFilter ? pillActive : pillInactive)}
            >
              <MapPin className='size-3.5' />
              {locationLabel}
              <ChevronDown className='size-3' />
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-52 p-0' align='start'>
            {/* Cerca de mí row */}
            <div className='p-1'>
              <button
                type='button'
                onClick={handleNearbyClick}
                disabled={isNearbyLoading}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
                  value.type === 'nearby'
                    ? 'bg-accent font-medium'
                    : 'hover:bg-accent',
                  isNearbyLoading && 'opacity-50 cursor-not-allowed',
                )}
              >
                {isNearbyLoading ? (
                  <Loader2 className='size-4 shrink-0 animate-spin text-muted-foreground' />
                ) : (
                  <Navigation className='size-4 shrink-0 text-muted-foreground' />
                )}
                Cerca de mí
                {value.type === 'nearby' && <Check className='size-3.5 ml-auto' />}
              </button>
            </div>

            {regionOptions.length > 0 && (
              <>
                <Separator />
                <div className='max-h-52 overflow-auto p-1'>
                  {regionOptions.map(r => {
                    const selected = selectedRegions.includes(r.value);
                    return (
                      <button
                        key={r.value}
                        type='button'
                        onClick={() => handleRegionToggle(r.value)}
                        className='flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer'
                      >
                        <div
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded-sm border',
                            selected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/30',
                          )}
                        >
                          {selected && <Check className='size-3' />}
                        </div>
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {hasLocationFilter && (
              <>
                <Separator />
                <button
                  type='button'
                  onClick={() => {
                    onChange({...value, type: 'all', regions: undefined, lat: undefined, lng: undefined});
                    setRegionOpen(false);
                  }}
                  className='flex w-full items-center justify-center px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground'
                >
                  Limpiar
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>

        {/* Clear all */}
        {hasAnyFilter && (
          <button
            type='button'
            onClick={() => {
              onChange({type: 'all'});
              scrollIntoView();
            }}
            className='inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground transition-colors'
          >
            <X className='size-3.5' />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

const pillBase =
  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors border cursor-pointer';
const pillActive = 'bg-primary text-primary-foreground border-primary';
const pillInactive =
  'bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground';

function FilterPill({
  children,
  active,
  onClick,
  disabled,
  icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        pillBase,
        active ? pillActive : pillInactive,
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
