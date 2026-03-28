import {createFileRoute, redirect} from '@tanstack/react-router';

export const Route = createFileRoute('/cuenta/estado-verificacion')({
  beforeLoad: () => {
    throw redirect({to: '/cuenta/configuracion', replace: true});
  },
});
