import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  triggerCronjobMutation,
  type AdminCronjobTriggerKey,
} from '~/lib/api/admin';
import {
  Bell,
  Briefcase,
  Clock,
  CreditCard,
  Globe,
  Loader2,
  Upload,
} from 'lucide-react';
import {toast} from 'sonner';
import type {LucideIcon} from 'lucide-react';

const CRONJOBS: {
  key: AdminCronjobTriggerKey;
  title: string;
  description: string;
  buttonLabel: string;
  runningLabel: string;
  icon: LucideIcon;
  /** Extra caution for long-running work */
  emphasize?: boolean;
}[] = [
  {
    key: 'syncPaymentsAndExpireOrders',
    title: 'Pagos y órdenes',
    description:
      'Consulta el estado de los pagos en el proveedor, actualiza órdenes y expira reservas u órdenes pendientes según las reglas del sistema (misma lógica que el cron programado).',
    buttonLabel: 'Ejecutar sincronización',
    runningLabel: 'Sincronizando…',
    icon: CreditCard,
  },
  {
    key: 'notifyUploadAvailability',
    title: 'Recordatorios de subida de entradas',
    description:
      'Envía avisos a vendedores cuando sus entradas entran en la ventana de subida de documentación (milestones 72h, 48h, etc., según el evento).',
    buttonLabel: 'Ejecutar recordatorios',
    runningLabel: 'Procesando recordatorios…',
    icon: Upload,
  },
  {
    key: 'checkPayoutHoldPeriods',
    title: 'Retenciones y documentación de ganancias',
    description:
      'Detecta documentación faltante tras el fin del evento, marca ganancias retenidas y libera períodos de retención cuando corresponde (afecta retiros disponibles).',
    buttonLabel: 'Ejecutar verificación',
    runningLabel: 'Verificando…',
    icon: Clock,
  },
  {
    key: 'processPendingNotifications',
    title: 'Cola de notificaciones',
    description:
      'Procesa lotes de notificaciones pendientes y reintenta envíos fallidos (correo, etc.).',
    buttonLabel: 'Procesar notificaciones',
    runningLabel: 'Procesando notificaciones…',
    icon: Bell,
  },
  {
    key: 'processPendingJobs',
    title: 'Trabajos en segundo plano',
    description:
      'Ejecuta jobs encolados (facturación FEU, envíos diferidos, acciones post-notificación, etc.).',
    buttonLabel: 'Procesar jobs',
    runningLabel: 'Procesando jobs…',
    icon: Briefcase,
  },
  {
    key: 'scrapeEvents',
    title: 'Scraping de eventos',
    description:
      'Importa y actualiza eventos desde las plataformas configuradas (Entraste, RedTickets, Tickantel). Puede tardar varios minutos y consumir cuota de los sitios externos.',
    buttonLabel: 'Ejecutar scraping',
    runningLabel: 'Scrapeando…',
    icon: Globe,
    emphasize: true,
  },
];

export function AdminCronjobsPage() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...triggerCronjobMutation(),
    onSuccess: (data, key) => {
      toast.success(data.message);
      if (key === 'checkPayoutHoldPeriods') {
        queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
      }
    },
    onError: (
      error: {response?: {data?: {message?: string}}},
      key: AdminCronjobTriggerKey,
    ) => {
      const jobTitle = CRONJOBS.find(j => j.key === key)?.title ?? 'Tarea';
      toast.error(
        error.response?.data?.message ||
          `No se pudo ejecutar: ${jobTitle}`,
      );
    },
  });

  const activeKey = mutation.variables;
  const isPending = mutation.isPending;

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>Tareas programadas</h1>
        <p className='mt-2 max-w-3xl text-muted-foreground'>
          Ejecutá manualmente la misma lógica que corren los crons en producción.
          Usá esto para pruebas o cuando necesités resultados sin esperar al
          próximo ciclo. Cada acción corre en el servidor y puede tardar según la
          carga de datos.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        {CRONJOBS.map(job => {
          const Icon = job.icon;
          const thisRunning = isPending && activeKey === job.key;
          return (
            <Card
              key={job.key}
              className={
                job.emphasize ? 'border-amber-500/40 bg-amber-500/[0.03]' : ''
              }
            >
              <CardHeader>
                <div className='flex items-start gap-3'>
                  <div
                    className={
                      job.emphasize
                        ? 'rounded-lg bg-amber-500/15 p-2 text-amber-700 dark:text-amber-400'
                        : 'rounded-lg bg-muted p-2 text-muted-foreground'
                    }
                  >
                    <Icon className='h-5 w-5' />
                  </div>
                  <div className='min-w-0 flex-1 space-y-1'>
                    <CardTitle className='text-lg leading-tight'>
                      {job.title}
                    </CardTitle>
                    <CardDescription className='text-sm leading-relaxed'>
                      {job.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant={job.emphasize ? 'secondary' : 'outline'}
                  size='sm'
                  disabled={isPending}
                  onClick={() => mutation.mutate(job.key)}
                  className='w-full sm:w-auto'
                >
                  {thisRunning ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {job.runningLabel}
                    </>
                  ) : (
                    job.buttonLabel
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
