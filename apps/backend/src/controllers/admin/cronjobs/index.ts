import {
  Route,
  Post,
  Tags,
  Middlewares,
  Response,
} from '@mathfalcon/tsoa-runtime';
import {requireAuthMiddleware, requireAdminMiddleware} from '~/middleware';
import {UnauthorizedError} from '~/errors';
import {runScheduledJobOnce} from '~/services/cronjobs/runScheduledJobOnce';

type TriggerCronjobResponse = {success: boolean; message: string};

@Route('admin/cronjobs')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Cronjobs')
export class AdminCronjobsController {
  @Post('/sync-payments-and-expire-orders')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async triggerSyncPaymentsAndExpireOrders(): Promise<TriggerCronjobResponse> {
    await runScheduledJobOnce('sync-payments-and-expire-orders');
    return {
      success: true,
      message:
        'Sincronización de pagos con el proveedor y expiración de órdenes pendientes completada.',
    };
  }

  @Post('/notify-upload-availability')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async triggerNotifyUploadAvailability(): Promise<TriggerCronjobResponse> {
    await runScheduledJobOnce('notify-upload-availability');
    return {
      success: true,
      message:
        'Recordatorios de ventana de subida de entradas (milestones) procesados.',
    };
  }

  @Post('/check-payout-hold-periods')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async triggerCheckPayoutHoldPeriods(): Promise<TriggerCronjobResponse> {
    await runScheduledJobOnce('check-payout-hold-periods');
    return {
      success: true,
      message:
        'Verificación de documentación faltante y liberación de retenciones de ganancias completada.',
    };
  }

  @Post('/process-pending-notifications')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async triggerProcessPendingNotifications(): Promise<TriggerCronjobResponse> {
    await runScheduledJobOnce('process-pending-notifications');
    return {
      success: true,
      message:
        'Envío de lotes de notificaciones y reintentos de notificaciones fallidas procesado.',
    };
  }

  @Post('/process-pending-jobs')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async triggerProcessPendingJobs(): Promise<TriggerCronjobResponse> {
    await runScheduledJobOnce('process-pending-jobs');
    return {
      success: true,
      message: 'Cola de trabajos en segundo plano (jobs) procesada.',
    };
  }

  @Post('/scrape-events')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async triggerScrapeEvents(): Promise<TriggerCronjobResponse> {
    await runScheduledJobOnce('scrape-events');
    return {
      success: true,
      message:
        'Scraping de eventos desde plataformas externas finalizado (puede tardar varios minutos).',
    };
  }
}
