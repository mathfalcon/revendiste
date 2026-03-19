import {createFileRoute, useNavigate, Link} from '@tanstack/react-router';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {seo} from '~/utils/seo';
import {getMyTicketReportsQuery} from '~/lib';
import {CASE_STATUS_LABELS, CASE_TYPE_LABELS} from '@revendiste/shared';
import type {TicketReportStatus, TicketReportCaseType} from '@revendiste/shared';
import {Plus, Flag} from 'lucide-react';
import {CreateCaseDialog} from '~/components';

export const Route = createFileRoute('/cuenta/reportes/')({
  component: MisReportesPage,
  head: () => ({
    meta: [
      ...seo({
        title: 'Mis Reportes | Revendiste',
        noIndex: true,
      }),
    ],
  }),
  loader: ({context}) => {
    context.queryClient.prefetchQuery(getMyTicketReportsQuery());
  },
});

const STATUS_CONFIG: Record<
  TicketReportStatus,
  {label: string; dotColor: string; textColor: string}
> = {
  awaiting_support: {
    label: CASE_STATUS_LABELS.awaiting_support,
    dotColor: 'bg-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  awaiting_customer: {
    label: CASE_STATUS_LABELS.awaiting_customer,
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
  closed: {
    label: CASE_STATUS_LABELS.closed,
    dotColor: 'bg-muted-foreground',
    textColor: 'text-muted-foreground',
  },
};

function MisReportesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {data, isLoading} = useQuery(getMyTicketReportsQuery());

  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Mis Reportes</h2>
        </div>
        <div className='flex items-center justify-center py-12'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Mis Reportes</h2>
          <Button size='sm' onClick={() => setCreateOpen(true)}>
            <Plus className='h-4 w-4 mr-1' />
            Abrir un caso
          </Button>
        </div>
        <p className='text-sm text-muted-foreground'>
          Sugerencia: También podés reportar problemas directamente desde tus entradas.
        </p>
      </div>

      {(data as any)?.data?.length === 0 ? (
        <div className='text-center py-12 text-muted-foreground'>
          <Flag className='h-12 w-12 mx-auto mb-3 opacity-30' />
          <p>No tienes reportes abiertos</p>
          <p className='text-sm mt-1'>Si tuviste un problema con una compra, podés abrir un caso.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {(data as any)?.data?.map((report: any) => {
            const status = STATUS_CONFIG[report.status as TicketReportStatus] ?? {
              label: report.status,
              dotColor: 'bg-muted-foreground',
              textColor: 'text-muted-foreground',
            };
            return (
              <Link
                key={report.id}
                to="/cuenta/reportes/$reportId"
                params={{reportId: report.id}}
                className="block"
              >
                <Card className='cursor-pointer hover:bg-muted/30 transition-colors'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-start justify-between gap-3'>
                      <CardTitle className='text-base leading-snug'>
                        {CASE_TYPE_LABELS[report.caseType as TicketReportCaseType] ?? report.caseType}
                      </CardTitle>
                      <div className='flex items-center gap-1.5 shrink-0 mt-0.5'>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
                        <span className={`text-xs ${status.textColor}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(report.createdAt).toLocaleDateString('es-UY', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    {report.description && (
                      <p className='text-sm mt-1.5 line-clamp-2 text-muted-foreground'>
                        {report.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <CreateCaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={reportId => {
          queryClient.invalidateQueries({queryKey: ['ticket-reports']});
          navigate({to: '/cuenta/reportes/$reportId', params: {reportId}});
        }}
      />
    </div>
  );
}
