import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Panel de Administración</h1>
        <p className='text-muted-foreground'>
          Bienvenido al panel de administración. Gestiona pagos, reportes y más.
        </p>
      </div>
    </div>
  );
}
