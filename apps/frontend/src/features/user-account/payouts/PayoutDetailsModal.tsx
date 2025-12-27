import {useSearch, useNavigate} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import {Badge} from '~/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {getPayoutDetailsQuery} from '~/lib/api/payouts';
import {formatCurrency, formatDate} from '~/utils';
import {CheckCircle, XCircle, Clock, AlertCircle, Download} from 'lucide-react';
import {getFileIcon, formatFileSize} from '~/utils/file-icons';
import {Button} from '~/components/ui/button';

export function PayoutDetailsModal() {
  const search = useSearch({from: '/cuenta/retiro'});
  const navigate = useNavigate({from: '/cuenta/retiro'});
  const payoutId = search.payoutId;

  const {data: payout, isPending} = useQuery({
    ...getPayoutDetailsQuery(payoutId || ''),
    enabled: !!payoutId,
  });

  const handleClose = () => {
    navigate({
      search: prev => ({
        ...prev,
        payoutId: undefined,
      }),
      resetScroll: false,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant='outline'
            className='border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
          >
            <Clock className='h-3 w-3 mr-1' />
            Pendiente
          </Badge>
        );
      case 'processing':
        return (
          <Badge
            variant='outline'
            className='border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400'
          >
            <AlertCircle className='h-3 w-3 mr-1' />
            Procesando
          </Badge>
        );
      case 'completed':
        return (
          <Badge
            variant='outline'
            className='border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
          >
            <CheckCircle className='h-3 w-3 mr-1' />
            Completado
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant='destructive'>
            <XCircle className='h-3 w-3 mr-1' />
            Fallido
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant='outline' className='border-gray-500 bg-gray-500/10'>
            <XCircle className='h-3 w-3 mr-1' />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'payout_requested':
        return 'Retiro solicitado';
      case 'admin_processed':
        return 'Procesado';
      case 'transfer_completed':
        return 'Retiro completada';
      case 'transfer_failed':
        return 'Transferencia fallida';
      case 'cancelled':
        return 'Cancelado';
      case 'status_change':
        return 'Cambio de estado';
      default:
        return eventType;
    }
  };

  if (!payoutId) {
    return null;
  }

  return (
    <Dialog open={!!payoutId} onOpenChange={handleClose}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Detalles del retiro</DialogTitle>
          <DialogDescription>
            Información completa sobre tu solicitud de pago
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className='flex h-64 items-center justify-center'>
            <LoadingSpinner size={64} />
          </div>
        ) : !payout ? (
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>
              No se pudo cargar la información del pago
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Status and Amount */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>Estado del retiro</CardTitle>
                  {getStatusBadge(payout.status)}
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>Monto:</span>
                  <span className='text-lg font-semibold'>
                    {formatCurrency(payout.amount, payout.currency)}
                  </span>
                </div>
                {payout.processingFee && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>
                      Comisión de procesamiento:
                    </span>
                    <span className='text-sm font-medium'>
                      {formatCurrency(
                        String(payout.processingFee),
                        payout.currency,
                      )}
                    </span>
                  </div>
                )}
                {payout.transactionReference && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>
                      Referencia de transacción:
                    </span>
                    <span className='text-sm font-mono'>
                      {payout.transactionReference}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Fechas</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    Solicitado:
                  </span>
                  <span className='text-sm'>
                    {formatDate(payout.requestedAt)}
                  </span>
                </div>
                {payout.processedAt && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>
                      Procesado:
                    </span>
                    <span className='text-sm'>
                      {formatDate(payout.processedAt)}
                    </span>
                  </div>
                )}
                {payout.completedAt && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>
                      Completado:
                    </span>
                    <span className='text-sm'>
                      {formatDate(payout.completedAt)}
                    </span>
                  </div>
                )}
                {payout.failedAt && (
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>
                      Fallido:
                    </span>
                    <span className='text-sm'>
                      {formatDate(payout.failedAt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Notes */}
            {payout.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Notas del retiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                    {payout.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Failure Reason */}
            {payout.failureReason && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base text-destructive'>
                    Motivo del Fallo
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                    {payout.failureReason}
                  </p>
                  {(payout.status === 'failed' ||
                    payout.status === 'cancelled') && (
                    <p className='text-sm text-muted-foreground pt-2 border-t'>
                      Tu dinero sigue disponible en tu balance y podés solicitar
                      un nuevo retiro cuando quieras. Si creés que esto es un
                      error o necesitás ayuda, podés contactarnos desde tu
                      cuenta.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payout Method */}
            {payout.payoutMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Método de retiro</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>Tipo:</span>
                    <span className='text-sm font-medium'>
                      {payout.payoutMethod.payoutType === 'uruguayan_bank'
                        ? 'Banco Uruguayo'
                        : 'PayPal'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>
                      Titular:
                    </span>
                    <span className='text-sm font-medium'>
                      {payout.payoutMethod.accountHolderName}{' '}
                      {payout.payoutMethod.accountHolderSurname}
                    </span>
                  </div>
                  {payout.payoutMethod.payoutType === 'uruguayan_bank' &&
                    payout.payoutMethod.metadata &&
                    typeof payout.payoutMethod.metadata === 'object' &&
                    payout.payoutMethod.metadata !== null && (
                      <>
                        {('bankName' in payout.payoutMethod.metadata ||
                          'bank_name' in payout.payoutMethod.metadata) && (
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-muted-foreground'>
                              Banco:
                            </span>
                            <span className='text-sm font-medium'>
                              {
                                ('bankName' in payout.payoutMethod.metadata
                                  ? payout.payoutMethod.metadata.bankName
                                  : payout.payoutMethod.metadata.bank_name) as
                                  | string
                                  | undefined
                              }
                            </span>
                          </div>
                        )}
                        {('accountNumber' in payout.payoutMethod.metadata ||
                          'account_number' in payout.payoutMethod.metadata) && (
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-muted-foreground'>
                              Número de cuenta:
                            </span>
                            <span className='text-sm font-mono'>
                              {
                                ('accountNumber' in payout.payoutMethod.metadata
                                  ? payout.payoutMethod.metadata.accountNumber
                                  : payout.payoutMethod.metadata
                                      .account_number) as string | undefined
                              }
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  {payout.payoutMethod.payoutType === 'paypal' &&
                    payout.payoutMethod.metadata &&
                    typeof payout.payoutMethod.metadata === 'object' &&
                    payout.payoutMethod.metadata !== null &&
                    'email' in payout.payoutMethod.metadata && (
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-muted-foreground'>
                          Email:
                        </span>
                        <span className='text-sm font-medium'>
                          {payout.payoutMethod.metadata.email as string}
                        </span>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Payout Events Timeline */}
            {payout.events && payout.events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    Historial de Eventos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {payout.events.map((event, index) => (
                      <div
                        key={event.id}
                        className='flex gap-3 pb-3 border-b last:border-b-0'
                      >
                        <div className='flex-shrink-0 mt-1'>
                          <div className='w-2 h-2 rounded-full bg-primary' />
                        </div>
                        <div className='flex-1 space-y-1'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>
                              {getEventTypeLabel(event.eventType)}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {formatDate(event.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Linked Earnings */}
            {payout.linkedEarnings && payout.linkedEarnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    Ganancias Vinculadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type='single' collapsible>
                    <AccordionItem value='earnings' className='border-none'>
                      <AccordionTrigger className='text-sm py-2'>
                        Ver ganancias ({payout.linkedEarnings.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className='space-y-2 pt-2'>
                          {payout.linkedEarnings.map(earning => (
                            <div
                              key={earning.id}
                              className='flex justify-between items-center text-sm border-b pb-2'
                            >
                              <span className='text-muted-foreground'>
                                Ticket {earning.listingTicketId.slice(0, 8)}
                              </span>
                              <span className='font-medium'>
                                {formatCurrency(
                                  earning.sellerAmount,
                                  earning.currency,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {payout.documents && payout.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    Comprobantes ({payout.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {payout.documents.map(doc => {
                    const FileIcon = getFileIcon(doc.mimeType);
                    return (
                      <div
                        key={doc.id}
                        className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                      >
                        <div className='flex items-center gap-3 flex-1 min-w-0'>
                          <FileIcon className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium truncate'>
                              {doc.originalName}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {formatFileSize(doc.sizeBytes)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            window.open(doc.url, '_blank');
                          }}
                        >
                          <Download className='h-4 w-4 mr-1' />
                          Descargar
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
