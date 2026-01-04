import {HomeAbout} from './HomeAbout';
import {HomeEvents} from './HomeEvents';
import {HomeHero} from './HomeHero';

export const HomePage = () => {
  return (
    <div className='flex flex-col'>
      <HomeHero />
      <HomeAbout />
      <HomeEvents />
    </div>
  );
};
