import {HomeAbout} from './HomeAbout';
import {HomeEvents} from './HomeEvents';
import {HomeHero} from './HomeHero';
import {TrendingEvents} from './TrendingEvents';

export const HomePage = () => {
  return (
    <div className='flex flex-col'>
      <HomeHero />
      <TrendingEvents />
      <HomeEvents />
      <HomeAbout />
    </div>
  );
};
