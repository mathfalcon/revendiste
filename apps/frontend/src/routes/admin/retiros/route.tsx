import {createFileRoute, Outlet} from '@tanstack/react-router';

export const Route = createFileRoute('/admin/retiros')({
  component: RetirosLayout,
});

function RetirosLayout() {
  return <Outlet />;
}
