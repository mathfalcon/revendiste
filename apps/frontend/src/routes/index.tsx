import {useAuth} from '@clerk/tanstack-react-start';
import {createFileRoute} from '@tanstack/react-router';
import {HomePage} from '~/features';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const asd = useAuth();
  return <HomePage />;
}
