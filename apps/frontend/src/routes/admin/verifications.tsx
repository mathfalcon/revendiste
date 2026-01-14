import {createFileRoute, useSearch, useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {useSuspenseQuery} from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {adminVerificationsQueryOptions} from '~/lib/api/admin';
import {useState} from 'react';
import {VerificationReviewDialog} from '~/features/admin/verifications/VerificationReviewDialog';

const verificationsSearchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'verificationAttempts'])
    .optional()
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z
    .enum(['requires_manual_review', 'pending', 'failed', 'completed'])
    .optional(),
});

export const Route = createFileRoute('/admin/verifications')({
  component: VerificationsPage,
  validateSearch: verificationsSearchSchema,
  loaderDeps: ({search}) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 10,
    sortBy: search.sortBy ?? 'updatedAt',
    sortOrder: search.sortOrder ?? 'desc',
    status: search.status,
  }),
  loader: ({context, deps}) => {
    return context.queryClient.ensureQueryData(
      adminVerificationsQueryOptions(deps),
    );
  },
});

function VerificationsPage() {
  const search = useSearch({from: '/admin/verifications'});
  const navigate = useNavigate({from: '/admin/verifications'});
  const [reviewingUserId, setReviewingUserId] = useState<string | null>(null);

  const {data} = useSuspenseQuery(
    adminVerificationsQueryOptions({
      page: search.page ?? 1,
      limit: search.limit ?? 10,
      sortBy: search.sortBy ?? 'updatedAt',
      sortOrder: search.sortOrder ?? 'desc',
      status: search.status,
    }),
  );

  const isManualReviewFilterActive = search.status === 'requires_manual_review';

  const getStatusBadgeProps = (status: string | null) => {
    switch (status) {
      case 'requires_manual_review':
        return {
          variant: 'outline' as const,
          className:
            'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400',
        };
      case 'pending':
        return {
          variant: 'outline' as const,
          className:
            'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
        };
      case 'completed':
        return {
          variant: 'outline' as const,
          className:
            'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
        };
      default:
        return {
          variant: 'outline' as const,
        };
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'requires_manual_review':
        return 'Revisión Manual';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      default:
        return status || 'Sin estado';
    }
  };

  const getDocumentTypeLabel = (type: string | null) => {
    switch (type) {
      case 'ci_uy':
        return 'CI Uruguay';
      case 'dni_ar':
        return 'DNI Argentina';
      case 'passport':
        return 'Pasaporte';
      default:
        return type || '-';
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Verificaciones de Identidad</h1>
          <p className='text-muted-foreground'>
            Revisa y aprueba las verificaciones de identidad de los usuarios
          </p>
        </div>
        <Button
          variant={isManualReviewFilterActive ? 'default' : 'outline'}
          onClick={() => {
            navigate({
              search: (prev: typeof search) => ({
                ...prev,
                status: isManualReviewFilterActive
                  ? undefined
                  : 'requires_manual_review',
                page: 1,
              }),
            });
          }}
        >
          {isManualReviewFilterActive
            ? 'Mostrar Todos'
            : 'Solo Revisión Manual'}
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Intentos</TableHead>
              <TableHead>Motivo de Revisión</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center'>
                  No se encontraron verificaciones
                </TableCell>
              </TableRow>
            ) : (
              data.data.map(verification => (
                <TableRow key={verification.id}>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-medium'>
                        {verification.firstName} {verification.lastName}
                      </span>
                      <span className='text-sm text-muted-foreground'>
                        {verification.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-medium'>
                        {getDocumentTypeLabel(verification.documentType)}
                      </span>
                      <span className='text-sm text-muted-foreground font-mono'>
                        {verification.documentNumber || '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      {...getStatusBadgeProps(verification.verificationStatus)}
                    >
                      {getStatusLabel(verification.verificationStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className='font-mono'>
                      {verification.verificationAttempts || 0}
                    </span>
                  </TableCell>
                  <TableCell className='max-w-[200px]'>
                    <span className='text-sm text-muted-foreground truncate block'>
                      {verification.manualReviewReason || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {verification.updatedAt
                      ? new Date(verification.updatedAt).toLocaleString(
                          'es-UY',
                          {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setReviewingUserId(verification.id)}
                    >
                      Revisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          Mostrando {data.data.length} de {data.pagination.total} verificaciones
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            disabled={!data.pagination.hasPrev}
            onClick={() => {
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  page: (prev.page || 1) - 1,
                }),
              });
            }}
          >
            Anterior
          </Button>
          <Button
            variant='outline'
            disabled={!data.pagination.hasNext}
            onClick={() => {
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  page: (prev.page || 1) + 1,
                }),
              });
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {reviewingUserId && (
        <VerificationReviewDialog
          userId={reviewingUserId}
          open={!!reviewingUserId}
          onOpenChange={open => !open && setReviewingUserId(null)}
        />
      )}
    </div>
  );
}
