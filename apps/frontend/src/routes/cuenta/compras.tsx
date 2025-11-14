import {createFileRoute} from '@tanstack/react-router';
import {MisComprasView} from '~/features';

export const Route = createFileRoute('/cuenta/compras')({
  component: MisComprasView,
});
