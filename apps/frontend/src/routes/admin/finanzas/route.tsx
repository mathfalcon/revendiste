import {createFileRoute, Outlet} from '@tanstack/react-router';

export const Route = createFileRoute('/admin/finanzas')({
  component: FinanzasLayout,
});

function FinanzasLayout() {
  return <Outlet />;
}
