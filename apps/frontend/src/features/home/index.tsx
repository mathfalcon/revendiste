import {useNavigate, useSearch} from '@tanstack/react-router';
import {useCallback} from 'react';
import {HomeAbout} from './HomeAbout';
import {HomeEvents} from './HomeEvents';
import {HomeHero} from './HomeHero';
import {TrendingEvents} from './TrendingEvents';
import type {LocationFilter} from './LocationFilter';

export const HomePage = () => {
  const search = useSearch({from: '/'});
  const navigate = useNavigate({from: '/'});

  const locationFilter: LocationFilter = (() => {
    const base = {
      dateFrom: search.desde,
      dateTo: search.hasta,
      hasTickets: search.conEntradas || undefined,
    };

    if (search.ubicacion === 'cerca' && search.lat && search.lng) {
      return {type: 'nearby' as const, lat: search.lat, lng: search.lng, ...base};
    }
    if (search.ubicacion) {
      const regions = search.ubicacion.split(',');
      return {type: 'region' as const, regions, ...base};
    }
    return {type: 'all' as const, ...base};
  })();

  const handleLocationChange = useCallback(
    (filter: LocationFilter) => {
      navigate({
        search: {
          ubicacion:
            filter.type === 'all'
              ? undefined
              : filter.type === 'nearby'
                ? 'cerca'
                : filter.regions?.join(','),
          lat: filter.type === 'nearby' ? filter.lat : undefined,
          lng: filter.type === 'nearby' ? filter.lng : undefined,
          desde: filter.dateFrom,
          hasta: filter.dateTo,
          conEntradas: filter.hasTickets || undefined,
        },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  return (
    <div className='flex flex-col'>
      <HomeHero />
      <TrendingEvents />
      <HomeEvents
        locationFilter={locationFilter}
        onLocationChange={handleLocationChange}
      />
      <HomeAbout />
    </div>
  );
};
