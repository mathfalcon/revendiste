import {Link} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {getRegionsQuery} from '~/lib';
import {regionToSlug, formatRegionDisplay} from '~/utils/location-slugs';

export const ExploreByLocation = () => {
  const {data: regionData} = useQuery(getRegionsQuery());

  if (!regionData?.length) return null;

  const allRegions = regionData.flatMap(group => group.regions);
  if (allRegions.length === 0) return null;

  return (
    <section className='mx-auto max-w-4xl px-4 py-8 md:py-12'>
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold text-center'>
          Explorar eventos por ubicación
        </h2>
        <div className='flex flex-wrap justify-center gap-2'>
          {allRegions.map(region => (
            <Link
              key={region}
              to='/eventos/en/$location'
              params={{location: regionToSlug(region)}}
              className='px-3 py-1.5 text-sm rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors'
            >
              {formatRegionDisplay(region)}
            </Link>
          ))}
          <Link
            to='/eventos/hoy'
            className='px-3 py-1.5 text-sm rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors'
          >
            Hoy
          </Link>
          <Link
            to='/eventos/este-fin-de-semana'
            className='px-3 py-1.5 text-sm rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors'
          >
            Este fin de semana
          </Link>
        </div>
      </div>
    </section>
  );
};
