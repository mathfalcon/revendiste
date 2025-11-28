import {createFileRoute} from '@tanstack/react-router';
import {MyPurchasesView} from '~/features';

export const Route = createFileRoute('/cuenta/compras')({
  component: MyPurchasesView,
});
