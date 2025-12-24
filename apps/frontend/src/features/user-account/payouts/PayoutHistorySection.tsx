import {useQuery} from '@tanstack/react-query';
import {getPayoutHistoryQuery} from '~/lib/api/payouts';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {formatCurrency, formatDate} from '~/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {CheckCircle, Clock, XCircle, AlertCircle} from 'lucide-react';

export function PayoutHistorySection() {
  const {data: history, isPending} = useQuery(getPayoutHistoryQuery(1, 20));

  if (isPending) {
    return (
      <Card className='w-full'>
        <CardContent className='flex h-96 items-center justify-center'>
          <LoadingSpinner size={96} />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.data.length === 0) {
    return (
      <div className='rounded-lg border bg-card p-6 text-center'>
        <p className='text-lg font-semibold mb-2'>No hay historial de pagos</p>
        <p className='text-muted-foreground'>
          Aún no has solicitado ningún pago
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700'>
            <Clock className='h-3 w-3 mr-1' />
            Pendiente
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant='outline' className='bg-blue-50 text-blue-700'>
            <AlertCircle className='h-3 w-3 mr-1' />
            Procesando
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Completado
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant='outline' className='bg-red-50 text-red-700'>
            <XCircle className='h-3 w-3 mr-1' />
            Fallido
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Historial de Pagos</h3>
        <p className='text-sm text-muted-foreground'>
          Historial de tus solicitudes de pago
        </p>
      </div>

      <div className='space-y-3'>
        {history.data.map(payout => (
          <Card key={payout.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base'>
                  Pago #{payout.id.slice(0, 8)}
                </CardTitle>
                {getStatusBadge(payout.status)}
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Monto:</span>
                <span className='font-semibold'>
                  {formatCurrency(payout.amount, payout.currency)}
                </span>
              </div>
              {(() => {
                const payoutWithMetadata = payout as unknown as {
                  metadata?: {
                    currencyConversion?: {
                      originalAmount: number;
                      originalCurrency: 'UYU' | 'USD';
                      exchangeRate: number;
                    };
                  };
                };
                const conversion =
                  payoutWithMetadata.metadata?.currencyConversion;
                if (conversion) {
                  return (
                    <div className='text-sm text-muted-foreground border-t pt-2 mt-2'>
                      <div className='flex justify-between items-center mb-1'>
                        <span>Monto original:</span>
                        <span>
                          {formatCurrency(
                            String(conversion.originalAmount),
                            conversion.originalCurrency,
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between items-center mb-1'>
                        <span>Monto convertido:</span>
                        <span className='font-medium'>
                          {formatCurrency(payout.amount, payout.currency)}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span>Tipo de cambio:</span>
                        <span>
                          {(conversion.exchangeRate * 100).toFixed(4)}%
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
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

              {payout.linkedEarnings && payout.linkedEarnings.length > 0 && (
                <Accordion type='single' collapsible className='mt-3'>
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
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
