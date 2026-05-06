import {createFileRoute} from '@tanstack/react-router';
import {seo} from '~/utils/seo';
import {AdminUsersPage} from '~/features/admin/users/AdminUsersPage';
import {usuariosSearchSchema} from '~/features/admin/users/usuarios-search';

export const Route = createFileRoute('/admin/usuarios')({
  component: AdminUsersPage,
  validateSearch: search => usuariosSearchSchema.parse(search),
  head: () => ({
    meta: [
      ...seo({
        title: 'Usuarios | Administración | Revendiste',
        noIndex: true,
      }),
    ],
  }),
});
