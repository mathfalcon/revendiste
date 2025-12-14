import {createFileRoute} from '@tanstack/react-router';
import {UploadTicketsView} from '~/features';
import {z} from 'zod';

const subirTicketsSearchSchema = z.object({
  subirTicket: z.string().optional(),
});

export const Route = createFileRoute('/cuenta/subir-tickets')({
  component: UploadTicketsView,
  validateSearch: subirTicketsSearchSchema,
});
