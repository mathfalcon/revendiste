import {Link} from '@tanstack/react-router';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {CopyButton} from '~/components/ui/copy-button';
import {Label} from '~/components/ui/label';
import {Separator} from '~/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {formatCurrency} from '~/utils';
import {getFileIcon, formatFileSize} from '~/utils/file-icons';
import {
  getBankName,
  getAccountNumber,
} from '~/features/user-account/payouts/payout-method-utils';
import {UruguayanBankMetadataSchema} from '@revendiste/shared/schemas/payout-methods';
import {getArgentinianPayoutViewModel} from './argentinian-payout-helpers';
import {statusBadge, providerLabel, formatAge} from './payout-utils';
import {Download, ExternalLink} from 'lucide-react';
import type {GetPayoutDetailsResponse} from '~/lib/api/generated';

interface PayoutCompletedSummaryProps {
  payout: GetPayoutDetailsResponse;
}

export function PayoutCompletedSummary({payout}: PayoutCompletedSummaryProps) {
  const payoutMethod = payout.payoutMethod;

  const bankName = payoutMethod?.metadata
    ? getBankName(payoutMethod.metadata)
    : null;
  const accountNumber = payoutMethod?.metadata
    ? getAccountNumber(payoutMethod.metadata)
    : null;
  const isUruguayanBank =
    payoutMethod?.payoutType === 'uruguayan_bank' &&
    payoutMethod?.metadata &&
    typeof payoutMethod.metadata === 'object' &&
    !Array.isArray(payoutMethod.metadata);
  const uruguayanBankMetadata = isUruguayanBank
    ? UruguayanBankMetadataSchema.safeParse(payoutMethod!.metadata)
    : null;
  const arView =
    payoutMethod?.payoutType === 'argentinian_bank' && payoutMethod?.metadata
      ? getArgentinianPayoutViewModel(payoutMethod.metadata)
      : null;

  return (
    <div className='space-y-4'>
      {/* Status & amount overview */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center gap-3 text-center'>
            <div className='flex flex-wrap items-center justify-center gap-2'>
              {statusBadge(payout.status)}
              <Badge variant='outline' className='capitalize'>
                {providerLabel(payout.payoutProvider)}
              </Badge>
            </div>
            <p className='text-3xl font-bold tabular-nums'>
              {formatCurrency(payout.amount, payout.currency)}
            </p>
            <p className='text-sm text-muted-foreground'>
              Solicitado hace {formatAge(payout.requestedAt)} ·{' '}
              {new Date(payout.requestedAt).toLocaleString('es-UY')}
            </p>
            {payout.completedAt && (
              <p className='text-sm text-muted-foreground'>
                Completado el{' '}
                {new Date(payout.completedAt).toLocaleString('es-UY')}
              </p>
            )}
            {payout.failedAt && (
              <p className='text-sm text-destructive'>
                Fallido el {new Date(payout.failedAt).toLocaleString('es-UY')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Failure reason */}
      {payout.failureReason && (
        <Card className='border-destructive/50'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base text-destructive'>
              Motivo de fallo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm'>{payout.failureReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Destination */}
      {payoutMethod && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Destino</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='rounded-lg border bg-muted/20 p-3'>
              <Label className='text-xs text-muted-foreground'>Titular</Label>
              <p className='font-medium'>
                {payoutMethod.accountHolderName}{' '}
                {payoutMethod.accountHolderSurname}
              </p>
            </div>
            {payoutMethod.payoutType === 'uruguayan_bank' &&
              uruguayanBankMetadata?.success && (
                <div className='grid gap-3 sm:grid-cols-2'>
                  {bankName && (
                    <div className='rounded-lg border bg-muted/20 p-3'>
                      <Label className='text-xs text-muted-foreground'>
                        Banco
                      </Label>
                      <p>{bankName}</p>
                    </div>
                  )}
                  {accountNumber && (
                    <div className='rounded-lg border bg-muted/20 p-3'>
                      <Label className='text-xs text-muted-foreground'>
                        Cuenta
                      </Label>
                      <p className='font-mono break-all'>{accountNumber}</p>
                    </div>
                  )}
                </div>
              )}

            {payoutMethod.payoutType === 'argentinian_bank' && arView && (
              <div className='space-y-3'>
                <div className='rounded-lg border bg-muted/20 p-3'>
                  <Label className='text-xs text-muted-foreground'>
                    Documento
                  </Label>
                  <p className='font-mono'>{arView.doc}</p>
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='rounded-lg border bg-muted/20 p-3'>
                    <Label className='text-xs text-muted-foreground'>
                      Banco
                    </Label>
                    <p>{arView.bank}</p>
                  </div>
                  <div className='rounded-lg border bg-muted/20 p-3'>
                    <Label className='text-xs text-muted-foreground'>
                      {arView.destinationLabel}
                    </Label>
                    <p className='font-mono break-all'>{arView.destination}</p>
                  </div>
                </div>
                <div className='rounded-lg border bg-muted/20 p-3'>
                  <Label className='text-xs text-muted-foreground'>
                    Moneda
                  </Label>
                  <p>{payoutMethod.currency}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing details */}
      {(payout.transactionReference ||
        payout.notes ||
        payout.processingFee) && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>
              Detalles de procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {payout.transactionReference && (
              <div className='flex items-center justify-between gap-2'>
                <span className='text-muted-foreground'>Referencia</span>
                <div className='flex items-center gap-1'>
                  <span className='font-mono'>
                    {payout.transactionReference}
                  </span>
                  <CopyButton text={payout.transactionReference} size='sm' />
                </div>
              </div>
            )}
            {payout.processingFee && Number(payout.processingFee) > 0 && (
              <div className='flex items-center justify-between gap-2'>
                <span className='text-muted-foreground'>Comisión</span>
                <span className='tabular-nums'>
                  {formatCurrency(payout.processingFee, payout.currency)}
                </span>
              </div>
            )}
            {payout.notes && (
              <>
                <Separator />
                <div>
                  <span className='text-muted-foreground'>Notas</span>
                  <p className='mt-1'>{payout.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {payout.documents && payout.documents.length > 0 && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Comprobantes</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {payout.documents.map(doc => {
              const FileIcon = getFileIcon(doc.mimeType);
              return (
                <div
                  key={doc.id}
                  className='flex items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3'
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <FileIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
                    <span className='truncate text-sm'>{doc.originalName}</span>
                    <span className='text-xs text-muted-foreground shrink-0'>
                      {formatFileSize(doc.sizeBytes)}
                    </span>
                  </div>
                  <div className='flex shrink-0 gap-1'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='cursor-pointer'
                      onClick={() =>
                        window.open(doc.url, '_blank', 'noopener,noreferrer')
                      }
                      aria-label={`Abrir ${doc.originalName} en nueva pestaña`}
                      title='Abrir en nueva pestaña'
                    >
                      <ExternalLink className='h-4 w-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='cursor-pointer'
                      asChild
                      aria-label={`Descargar ${doc.originalName}`}
                      title='Descargar'
                    >
                      <a
                        href={doc.url}
                        download={doc.originalName}
                        rel='noopener noreferrer'
                      >
                        <Download className='h-4 w-4' />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Earnings */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Ganancias incluidas</CardTitle>
          <CardDescription>
            {payout.linkedEarnings.length} ítem
            {payout.linkedEarnings.length !== 1 ? 'es' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monto</TableHead>
                <TableHead>Moneda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payout.linkedEarnings.map(e => (
                <TableRow key={e.id}>
                  <TableCell className='tabular-nums'>
                    {formatCurrency(e.sellerAmount, e.currency)}
                  </TableCell>
                  <TableCell>{e.currency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Linked settlements */}
      {payout.settlementInfo?.linkedProcessorSettlements &&
        payout.settlementInfo.linkedProcessorSettlements.length > 0 && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Liquidaciones</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {payout.settlementInfo.linkedProcessorSettlements.map(s => (
                <div
                  key={s.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3 text-sm'
                >
                  <div className='min-w-0'>
                    <p className='font-mono text-xs text-muted-foreground truncate'>
                      {s.externalSettlementId}
                    </p>
                    <p>
                      {formatCurrency(s.totalAmount, s.settlementCurrency)} ·{' '}
                      {s.paymentProvider}
                    </p>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='cursor-pointer'
                    asChild
                  >
                    <Link
                      to='/admin/finanzas/liquidaciones/$settlementId'
                      params={{settlementId: s.id}}
                    >
                      <ExternalLink className='mr-1.5 h-3.5 w-3.5' />
                      Ver
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      {/* Seller */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Vendedor</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {payout.seller ? (
            <>
              <p className='font-medium'>
                {payout.seller.firstName} {payout.seller.lastName}
              </p>
              <p className='text-muted-foreground'>{payout.seller.email}</p>
            </>
          ) : (
            <p className='text-muted-foreground'>
              Información del vendedor no disponible.
            </p>
          )}
          <div className='flex flex-wrap items-center gap-3 pt-1'>
            <Button
              variant='outline'
              size='sm'
              className='cursor-pointer'
              asChild
            >
              <Link to='/admin/verificaciones'>
                <ExternalLink className='mr-1.5 h-3.5 w-3.5' />
                Verificación de identidad
              </Link>
            </Button>
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <span className='font-mono break-all'>{payout.sellerUserId}</span>
              <CopyButton text={payout.sellerUserId} size='sm' />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
