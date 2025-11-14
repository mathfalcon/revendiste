import {createFileRoute} from '@tanstack/react-router';
import {PublicacionesView} from '~/features';

export const Route = createFileRoute('/cuenta/publicaciones')({
  component: PublicacionesView,
});
