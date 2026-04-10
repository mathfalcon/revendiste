import {createFileRoute, Outlet} from '@tanstack/react-router';

export const Route = createFileRoute('/admin/eventos')({
  component: EventosLayout,
});

function EventosLayout() {
  return <Outlet />;
}
