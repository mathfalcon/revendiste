import {createFileRoute, Outlet} from '@tanstack/react-router';

export const Route = createFileRoute('/cuenta/retiro')({
  component: RetiroLayout,
});

function RetiroLayout() {
  return <Outlet />;
}
