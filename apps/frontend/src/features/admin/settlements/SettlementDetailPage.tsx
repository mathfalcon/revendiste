import {useState} from 'react';
import {Link} from '@tanstack/react-router';
import {useMutation, useQueryClient, useSuspenseQuery} from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Label} from '~/components/ui/label';
import {Textarea} from '~/components/ui/textarea';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {
  adminSettlementBreakdownQueryOptions,
  completeSettlementMutation,
  failSettlementMutation,
} from '~/lib/api/admin';
import {formatCurrency} from '~/utils';
import {ArrowLeft, CheckCircle2, Loader2, XCircle} from 'lucide-react';
import {toast} from 'sonner';
import {parseProcessorSettlementMetadata} from '@revendiste/shared';

interface SettlementDetailPageProps {
  settlementId: string;
}

function formatMetadataForDisplay(
  metadata: Record<string, unknown> | null | undefined,
): string {
  if (metadata == null) return '';
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function SettlementDetailPage({settlementId}: SettlementDetailPageProps) {
  const queryClient = useQueryClient();
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [failReason, setFailReason] = useState('');

  const {data} = useSuspenseQuery(
    adminSettlementBreakdownQueryOptions(settlementId),
  );

  const {settlement, reconciliation, items} = data;

  const settlementMetadata = settlement.metadata;
  const parsedSettlementMetadata =
    parseProcessorSettlementMetadata(settlementMetadata);
  const failureReasonFromMeta =
    parsedSettlementMetadata?.failureReason ?? null;

  const invalidateSettlement = () => {
    void queryClient.invalidateQueries({
      queryKey: ['admin', 'settlements', settlementId, 'breakdown'],
    });
    void queryClient.invalidateQueries({queryKey: ['admin', 'settlements']});
  };

  const completeMutation = useMutation({
    ...completeSettlementMutation(),
    onSuccess: () => {
      invalidateSettlement();
      toast.success('Liquidación marcada como completada');
      setCompleteConfirmOpen(false);
    },
    onError: (error: {response?: {data?: {message?: string}}}) => {
      toast.error(
        error.response?.data?.message ||
          'No se pudo marcar la liquidación como completada',
      );
    },
  });

  const failMutation = useMutation({
    ...failSettlementMutation(),
    onSuccess: () => {
      invalidateSettlement();
      toast.success('Liquidación marcada como fallida');
      setFailDialogOpen(false);
      setFailReason('');
    },
    onError: (error: {response?: {data?: {message?: string}}}) => {
      toast.error(
        error.response?.data?.message ||
          'No se pudo marcar la liquidación como fallida',
      );
    },
  });

  const actionsLocked =
    completeMutation.isPending || failMutation.isPending;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente de cierre';
      case 'completed':
        return 'Completada';
      case 'failed':
        return 'Fallida';
      default:
        return status;
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant='outline' size='icon' asChild>
            <Link to='/admin/finanzas'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>Liquidación</h1>
            <p className='font-mono text-sm text-muted-foreground'>
              {settlement.settlementId}
            </p>
          </div>
        </div>
        <Badge variant='outline' className='w-fit capitalize'>
          {settlement.paymentProvider} · {getStatusLabel(settlement.status)}
        </Badge>
      </div>

      {settlement.status === 'pending' && (
        <Card className='border-amber-500/30 bg-amber-500/5'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Cierre operativo</CardTitle>
            <CardDescription>
              La liquidación está registrada pero sigue pendiente de cierre.
              Cuando la conciliación te resulte correcta, marcala como completada;
              si hubo un error o no aplica, marcala como fallida (podés dejar una
              nota interna).
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            <Button
              type='button'
              disabled={actionsLocked}
              onClick={() => setCompleteConfirmOpen(true)}
            >
              <CheckCircle2 className='mr-2 h-4 w-4' />
              Marcar como completada
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={actionsLocked}
              onClick={() => setFailDialogOpen(true)}
            >
              <XCircle className='mr-2 h-4 w-4' />
              Marcar como fallida
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={completeConfirmOpen}
        onOpenChange={setCompleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Completar liquidación?</AlertDialogTitle>
            <AlertDialogDescription>
              Quedará registrada como completada en el flujo de administración.
              Solo hacelo cuando hayas verificado la conciliación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completeMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type='button'
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate({settlementId})}
            >
              {completeMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={failDialogOpen}
        onOpenChange={open => {
          setFailDialogOpen(open);
          if (!open) setFailReason('');
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Marcar como fallida</DialogTitle>
            <DialogDescription>
              Usá esta opción si la liquidación no debe considerarse cerrada con
              éxito. El motivo es opcional y sirve como nota interna.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2 py-2'>
            <Label htmlFor='fail-reason'>Motivo (opcional)</Label>
            <Textarea
              id='fail-reason'
              value={failReason}
              onChange={e => setFailReason(e.target.value)}
              placeholder='Ej. monto no coincide con extracto, duplicado, etc.'
              rows={3}
              disabled={failMutation.isPending}
            />
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setFailDialogOpen(false)}
              disabled={failMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={failMutation.isPending}
              onClick={() =>
                failMutation.mutate({
                  settlementId,
                  reason: failReason.trim() || undefined,
                })
              }
            >
              {failMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Fecha de liquidación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {new Date(settlement.settlementDate).toLocaleDateString('es-UY', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Monto declarado
            </CardTitle>
          </CardHeader>
          <CardContent className='text-xl font-semibold'>
            {formatCurrency(settlement.totalAmount, settlement.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Pagos conciliados
            </CardTitle>
          </CardHeader>
          <CardContent className='text-xl font-semibold'>
            {reconciliation.paymentCount}
          </CardContent>
        </Card>
      </div>

      {settlement.status === 'failed' && failureReasonFromMeta ? (
        <Alert variant='destructive'>
          <AlertTitle>Motivo al marcar como fallida</AlertTitle>
          <AlertDescription className='whitespace-pre-wrap text-left'>
            {failureReasonFromMeta}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Metadatos</CardTitle>
          <CardDescription>
            Valor de <code className='rounded bg-muted px-1 text-xs'>metadata</code>{' '}
            en base de datos (reconciliación al crear, notas, etc.). Solo
            administración.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settlementMetadata == null || !isRecord(settlementMetadata) ? (
            <p className='text-sm text-muted-foreground'>
              Sin metadatos guardados.
            </p>
          ) : (
            <pre
              className='max-h-112 wrap-anywhere overflow-auto rounded-lg border bg-muted/40 p-4 text-left text-xs leading-relaxed font-mono'
              tabIndex={0}
            >
              {formatMetadataForDisplay(settlementMetadata)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de conciliación</CardTitle>
          {reconciliation.hasMultipleCurrencies && (
            <p className='text-xs text-muted-foreground'>
              Los pagos incluyen monedas distintas. Las ganancias de vendedores
              y el ingreso de la plataforma se convirtieron a{' '}
              {settlement.currency} usando el tipo de cambio de cada pago.
            </p>
          )}
        </CardHeader>
        <CardContent className='grid gap-2 sm:grid-cols-2'>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>Crédito del procesador</span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.totalProcessorCredits,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>Comisiones del procesador</span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.totalProcessorFees,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>
              Ganancias vendedores
              {reconciliation.hasMultipleCurrencies ? ' (conv.)' : ''}
            </span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.totalSellerEarningsConverted,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>
              Ingreso plataforma
              {reconciliation.hasMultipleCurrencies ? ' (est.)' : ''}
            </span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.platformRevenue,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>
              Diferencia (declarado − créditos)
            </span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.unreconciledDifference,
                settlement.currency,
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos incluidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID pago</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Comprador (cargo)</TableHead>
                  <TableHead>Crédito procesador</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>TC</TableHead>
                  <TableHead>Plataforma (est.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center'>
                      Sin ítems vinculados a pagos (liquidación manual o
                      histórica)
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map(row => (
                    <TableRow key={row.settlementItemId}>
                      <TableCell className='font-mono text-xs'>
                        {row.paymentId
                          ? `${row.paymentId.slice(0, 8)}…`
                          : '—'}
                      </TableCell>
                      <TableCell className='max-w-[140px] truncate font-mono text-xs'>
                        {row.providerPaymentId}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatCurrency(
                          row.customerAmount,
                          row.customerAmountCurrency,
                        )}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatCurrency(row.processorCredit, row.currency)}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatCurrency(row.processorFee, row.currency)}
                      </TableCell>
                      <TableCell className='tabular-nums text-xs text-muted-foreground'>
                        {row.exchangeRate != null ? row.exchangeRate : '—'}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatCurrency(row.platformShare, row.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
