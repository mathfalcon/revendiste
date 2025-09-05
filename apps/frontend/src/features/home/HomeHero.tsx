import {useEffect, useState} from 'react';
import heroImageUrl from '~/assets/backgrounds/homepage.png?url';
import {EventSearchInput} from '~/components/SearchInput';

const homePageTaglines = [
  'Si no vas, que tu entrada no quede tirada. Vendela fácil y seguro',
  '¿Te pintó ir a último momento? Conseguí tu entrada al toque',
  '¿Cambio de plan? La fiesta sigue, comprá o vendé tu entrada sin drama',
  'No llegás, pero tu entrada sí. Dejalo en nuestras manos',
  'El plan cambia, pero tu entrada no queda colgada',
  '¿Plan inesperado? La entrada la conseguís acá',
  'Tus amigos ya tienen entrada… ¿y vos?',
  'No te quedes afuera, todos ya están adentro',
  'Todos listos para la noche, solo faltás vos',
  'Que la historia no te la cuenten: sacá tu entrada ya',
];

function useRotatingTagline(taglines: string[], interval = 7500) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (taglines.length <= 1) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % taglines.length);
    }, interval);
    return () => clearInterval(id);
  }, [taglines, interval]);

  return index;
}

function AnimatedTagline({
  taglines,
  index,
}: {
  taglines: string[];
  index: number;
}) {
  const [displayedIndex, setDisplayedIndex] = useState(index);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (index !== displayedIndex) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayedIndex(index);
        setIsAnimating(false);
      }, 350); // match duration-300 or duration-350
      return () => clearTimeout(timeout);
    }
  }, [index, displayedIndex]);

  // Use Tailwind for fade and slide animation
  return (
    <h2
      className={`
        max-w-6xl
        text-foreground font-bold text-center text-2xl z-10
        transition-all duration-300 ease-in-out
        ${isAnimating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
      `}
      style={{minHeight: 56}}
    >
      {taglines[displayedIndex]}
    </h2>
  );
}

export const HomeHero = () => {
  const taglineIndex = useRotatingTagline(homePageTaglines);

  return (
    <section className='hero min-h-[50dvh] h-[50dvh]  relative flex flex-col items-center justify-center'>
      <img
        src={heroImageUrl}
        alt='People partying'
        className='w-full h-full object-cover absolute top-0 left-0'
      />
      <AnimatedTagline taglines={homePageTaglines} index={taglineIndex} />

      <div className='w-[45dvw]'>
        <EventSearchInput
          placeholder='¿A qué fiesta te sumás?'
          className='z-10 bg-background h-[48px]'
        />
      </div>
    </section>
  );
};
