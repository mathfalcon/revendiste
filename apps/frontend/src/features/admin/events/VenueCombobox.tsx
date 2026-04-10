import {useState, useCallback} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ChevronsUpDown, Check, MapPin} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {cn} from '~/lib/utils';
import {searchVenuesQueryOptions} from '~/lib/api/admin';

export interface VenueOption {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface VenueComboboxProps {
  value?: string; // venueId
  onValueChange: (
    venueId: string | undefined,
    venue: VenueOption | undefined,
  ) => void;
  placeholder?: string;
}

export function VenueCombobox({
  value,
  onValueChange,
  placeholder = 'Buscar lugar...',
}: VenueComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {data: venues = []} = useQuery({
    ...searchVenuesQueryOptions(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const selectedVenue = venues.find(v => v.id === value);

  const handleSelect = useCallback(
    (venue: VenueOption) => {
      onValueChange(venue.id, venue);
      setOpen(false);
      setSearchQuery('');
    },
    [onValueChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {selectedVenue ? (
            <div className='flex items-center gap-2 truncate text-left'>
              <MapPin className='h-4 w-4 flex-shrink-0' />
              <div className='truncate'>
                <div className='font-medium'>{selectedVenue.name}</div>
                <div className='text-xs text-muted-foreground truncate'>
                  {selectedVenue.city}
                </div>
              </div>
            </div>
          ) : (
            <div className='text-muted-foreground'>{placeholder}</div>
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command>
          <CommandInput
            placeholder='Buscar lugares...'
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery.length === 0
                ? 'Escribe para buscar'
                : 'No se encontraron lugares'}
            </CommandEmpty>
            <CommandGroup>
              {venues.map(venue => (
                <CommandItem
                  key={venue.id}
                  value={venue.id}
                  onSelect={() => handleSelect(venue)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === venue.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className='flex flex-1 flex-col'>
                    <div className='font-medium'>{venue.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      {venue.address}, {venue.city}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
