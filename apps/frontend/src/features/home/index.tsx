import {HomeEvents} from './HomeEvents';
import {HomeHero} from './HomeHero';

export const HomePage = () => {
  return (
    <div className='flex flex-col'>
      <HomeHero />
      <HomeEvents />
    </div>
  );
};
