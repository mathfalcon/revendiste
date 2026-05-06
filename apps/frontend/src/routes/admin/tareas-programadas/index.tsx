import {createFileRoute} from '@tanstack/react-router';
import {AdminCronjobsPage} from '~/features/admin/cronjobs/AdminCronjobsPage';

export const Route = createFileRoute('/admin/tareas-programadas/')({
  component: AdminCronjobsPage,
});
