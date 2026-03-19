import {
  createFileRoute,
  useSearch,
  useNavigate,
  Link,
} from '@tanstack/react-router';
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
import {adminTicketReportsQueryOptions} from '~/lib';
import {CASE_STATUS_LABELS, CASE_TYPE_LABELS} from '@revendiste/shared';
import type {
  TicketReportStatus,
  TicketReportCaseType,
} from '@revendiste/shared';

const reportesSearchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z
    .enum(['awaiting_support', 'awaiting_customer', 'closed'])
    .optional(),
  caseType: z
    .enum([
      'invalid_ticket',
      'ticket_not_received',
      'problem_with_seller',
      'other',
    ])
    .optional(),
});

export const Route = createFileRoute('/admin/reportes/')({
  component: ReportesPage,
  validateSearch: reportesSearchSchema,
  loaderDeps: ({search}) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 20,
    sortBy: search.sortBy ?? 'createdAt',
    sortOrder: search.sortOrder ?? 'desc',
    status: search.status,
    caseType: search.caseType,
  }),
  loader: ({context, deps}) => {
    return context.queryClient.ensureQueryData(
      adminTicketReportsQueryOptions(deps),
    );
  },
});

const STATUS_BADGE: Record<
  TicketReportStatus,
  {label: string; variant: 'default' | 'secondary' | 'outline'}
> = {
  awaiting_support: {
    label: CASE_STATUS_LABELS.awaiting_support,
    variant: 'default',
  },
  awaiting_customer: {
    label: CASE_STATUS_LABELS.awaiting_customer,
    variant: 'secondary',
  },
  closed: {label: CASE_STATUS_LABELS.closed, variant: 'outline'},
};

type ReportesSearch = z.infer<typeof reportesSearchSchema>;

function ReportesPage() {
  const rawSearch = useSearch({from: '/admin/reportes/'});
  const search = rawSearch as ReportesSearch;
  const navigate = useNavigate({
    from: '/admin/reportes/' as '/admin/reportes',
  });

  const {data} = useSuspenseQuery(
    adminTicketReportsQueryOptions({
      page: search.page ?? 1,
      limit: search.limit ?? 20,
      sortBy: search.sortBy ?? 'createdAt',
      sortOrder: search.sortOrder ?? 'desc',
      status: search.status,
      caseType: search.caseType,
    }),
  );

  const setStatusFilter = (status?: TicketReportStatus) => {
    navigate({
      search: {...search, status, page: 1},
    } as unknown as Parameters<typeof navigate>[0]);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Reportes</h1>
      </div>

      {/* Status filter */}
      <div className='flex gap-2 mb-4 flex-wrap'>
        <Button
          variant={!search.status ? 'default' : 'outline'}
          size='sm'
          onClick={() => setStatusFilter(undefined)}
        >
          Todos
        </Button>
        {(
          [
            'awaiting_support',
            'awaiting_customer',
            'closed',
          ] as TicketReportStatus[]
        ).map(s => (
          <Button
            key={s}
            variant={search.status === s ? 'default' : 'outline'}
            size='sm'
            onClick={() => setStatusFilter(s)}
          >
            {CASE_STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Reportado por</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data as any)?.data?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center text-muted-foreground py-8'
                >
                  No hay reportes
                </TableCell>
              </TableRow>
            ) : (
              (data as any)?.data?.map((report: any) => {
                const badge = STATUS_BADGE[
                  report.status as TicketReportStatus
                ] ?? {label: report.status, variant: 'outline'};
                return (
                  <TableRow
                    key={report.id}
                    className='cursor-pointer hover:bg-muted/50'
                  >
                    <TableCell>
                      <Link
                        to='/admin/reportes/$reportId'
                        params={{reportId: report.id}}
                        className='block w-full h-full'
                      >
                        {CASE_TYPE_LABELS[
                          report.caseType as TicketReportCaseType
                        ] ?? report.caseType}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        to='/admin/reportes/$reportId'
                        params={{reportId: report.id}}
                        className='block w-full h-full'
                      >
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </Link>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      <Link
                        to='/admin/reportes/$reportId'
                        params={{reportId: report.id}}
                        className='block w-full h-full'
                      >
                        {report.reporterEmail ?? report.reportedByUserId}
                      </Link>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      <Link
                        to='/admin/reportes/$reportId'
                        params={{reportId: report.id}}
                        className='block w-full h-full'
                      >
                        {new Date(report.createdAt).toLocaleDateString('es-UY')}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        to='/admin/reportes/$reportId'
                        params={{reportId: report.id}}
                      >
                        <Button variant='ghost' size='sm'>
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-end gap-2 mt-4'>
        <Button
          variant='outline'
          size='sm'
          disabled={(search.page ?? 1) <= 1}
          onClick={() =>
            navigate({
              search: {...search, page: (search.page ?? 1) - 1},
            } as unknown as Parameters<typeof navigate>[0])
          }
        >
          Anterior
        </Button>
        <span className='text-sm'>Página {search.page ?? 1}</span>
        <Button
          variant='outline'
          size='sm'
          disabled={(data as any)?.pagination?.hasNext === false}
          onClick={() =>
            navigate({
              search: {...search, page: (search.page ?? 1) + 1},
            } as unknown as Parameters<typeof navigate>[0])
          }
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
