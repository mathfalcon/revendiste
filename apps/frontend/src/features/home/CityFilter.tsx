import {useQuery} from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {getEventCitiesQuery} from '~/lib';
import {MapPin} from 'lucide-react';

interface CityFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export const CityFilter = ({value, onChange}: CityFilterProps) => {
  const {data: cities, isLoading} = useQuery(getEventCitiesQuery());

  // Don't render if no cities available
  if (!isLoading && (!cities || cities.length === 0)) {
    return null;
  }

  return (
    <div className='flex items-center gap-2'>
      <MapPin className='h-4 w-4 text-muted-foreground' />
      <Select
        value={value || 'all'}
        onValueChange={v => onChange(v === 'all' ? undefined : v)}
        disabled={isLoading}
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='Todas las ciudades' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Todas las ciudades</SelectItem>
          {cities?.map(city => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
