import {createFileRoute} from '@tanstack/react-router';
import {HomePage} from '~/features';

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [
      {
        title: 'Revendiste | Transferí tus entradas de forma fácil y segura',
      },
    ],
  }),
});

function Home() {
  return <HomePage />;
}
