import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/cuenta/perfil')({
  component: PerfilComponent,
});

function PerfilComponent() {
  return (
    <div className='rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
      Perfil
    </div>
  );
}
