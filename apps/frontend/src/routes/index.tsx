import {createFileRoute} from '@tanstack/react-router';
import {HomePage} from '~/features';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return <HomePage />;
}
