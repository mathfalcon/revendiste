import {Button} from '~/components/ui/button';
import {HomeEvents} from './HomeEvents';
import {HomeHero} from './HomeHero';
import {useQuery} from '@tanstack/react-query';
import {api} from '~/lib';

export const HomePage = () => {
  const asd = useQuery({
    queryKey: ['test'],
    queryFn: () => api.events.getProtected(),
  });

  return (
    <>
      <Button>Click me</Button>
      <HomeHero />
      <HomeEvents />
    </>
  );
};
