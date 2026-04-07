import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {Label} from '~/components/ui/label';
import {Textarea} from '~/components/ui/textarea';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {PriceInput} from '~/components/ui/price-input';
import {EventTicketCurrency} from '~/lib';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {
  adminPayoutDetailsQueryOptions,
  processPayoutMutation,
  uploadPayoutDocumentMutation,
  deletePayoutDocumentMutation,
} from '~/lib/api/admin';
import {toast} from 'sonner';
import {
  Loader2,
  Upload,
  Trash2,
  Download,
  AlertTriangle,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import {
  getBankName,
  getAccountNumber,
  getEmail,
} from '~/features/user-account/payouts/payout-method-utils';
import {getFileIcon, formatFileSize} from '~/utils/file-icons';
import {CopyButton} from '~/components/ui/copy-button';
import {
  UruguayanBankMetadataSchema,
  PayPalMetadataSchema,
} from '@revendiste/shared/schemas/payout-methods';
import {formatProvidersList} from '@revendiste/shared';

// Form schema for processing
const processPayoutFormSchema = z.object({
  processingFee: z.coerce.number().min(0).optional(),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

type ProcessPayoutFormValues = z.infer<typeof processPayoutFormSchema>;

interface ProcessPayoutDialogProps {
  payoutId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessPayoutDialog({
  payoutId,
  open,
  onOpenChange,
}: ProcessPayoutDialogProps) {
  const queryClient = useQueryClient();
  const {data: payout, isLoading} = useQuery(
    adminPayoutDetailsQueryOptions(payoutId),
  );

  // UI state (not form data)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form setup
  const form = useForm<ProcessPayoutFormValues>({
    resolver: standardSchemaResolver(processPayoutFormSchema),
    defaultValues: {
      processingFee: 0,
      transactionReference: '',
      notes: '',
    },
  });

  // Reset step and form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentStep(1);
      form.reset();
    }
    onOpenChange(open);
  };

  const processMutation = useMutation({
    ...processPayoutMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts', payoutId]});
      toast.success('Retiro procesado');
      // Reset form
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al procesar el retiro',
      );
    },
  });

  const uploadDocumentMutation = useMutation({
    ...uploadPayoutDocumentMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts', payoutId]});
      toast.success('Comprobante subido');
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al subir el comprobante',
      );
    },
  });

  const deleteDocumentMutation = useMutation({
    ...deletePayoutDocumentMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts', payoutId]});
      toast.success('Comprobante eliminado');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al eliminar el comprobante',
      );
    },
  });

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comprobante?')) {
      return;
    }

    deleteDocumentMutation.mutate({documentId});
  };

  const handleProcess = (data: ProcessPayoutFormValues) => {
    // Store form data and show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmProcess = () => {
    const data = form.getValues();

    // Build updates object, always send at least an empty object
    const updates: {
      processingFee?: number;
      transactionReference?: string;
      notes?: string;
    } = {};

    if (data.processingFee && data.processingFee > 0) {
      updates.processingFee = data.processingFee;
    }
    if (data.transactionReference && data.transactionReference.trim() !== '') {
      updates.transactionReference = data.transactionReference.trim();
    }
    if (data.notes && data.notes.trim() !== '') {
      updates.notes = data.notes.trim();
    }

    // Always send at least an empty object to satisfy validation
    processMutation.mutate({
      payoutId,
      updates,
    });
    setShowConfirmDialog(false);
  };

  const handleUploadVoucher = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    uploadDocumentMutation.mutate({
      payoutId,
      file: selectedFile,
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: currency === 'UYU' ? 'UYU' : 'USD',
    }).format(Number(amount));
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className='flex items-center justify-center p-8'>
            <Loader2 className='h-6 w-6 animate-spin' />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payout) {
    return null;
  }

  const payoutMethod = payout.payoutMethod;
  const bankName = payoutMethod?.metadata
    ? getBankName(payoutMethod.metadata)
    : null;
  const accountNumber = payoutMethod?.metadata
    ? getAccountNumber(payoutMethod.metadata)
    : null;
  const email = payoutMethod?.metadata ? getEmail(payoutMethod.metadata) : null;

  // Parse metadata using schemas for type safety
  const isUruguayanBank =
    payoutMethod?.payoutType === 'uruguayan_bank' &&
    payoutMethod?.metadata &&
    typeof payoutMethod.metadata === 'object' &&
    !Array.isArray(payoutMethod.metadata);
  const isPayPal =
    payoutMethod?.payoutType === 'paypal' &&
    payoutMethod?.metadata &&
    typeof payoutMethod.metadata === 'object' &&
    !Array.isArray(payoutMethod.metadata);

  const uruguayanBankMetadata = isUruguayanBank
    ? UruguayanBankMetadataSchema.safeParse(payoutMethod.metadata)
    : null;
  const paypalMetadata = isPayPal
    ? PayPalMetadataSchema.safeParse(payoutMethod.metadata)
    : null;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1
              ? 'Revisar Detalles del retiro'
              : 'Procesar retiro'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1
              ? 'Revisa los detalles del retiro y la información de transferencia antes de continuar.'
              : 'Completa la información de procesamiento y sube el comprobante.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Step indicator */}
          {payout.status === 'pending' && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep === 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  1
                </div>
                <span className={currentStep === 1 ? 'font-medium' : ''}>
                  Detalles del Retiro
                </span>
              </div>
              <div className='h-px flex-1 bg-border' />
              <div className='flex items-center gap-2'>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep === 2
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  2
                </div>
                <span className={currentStep === 2 ? 'font-medium' : ''}>
                  Procesamiento
                </span>
              </div>
            </div>
          )}

          {/* Payout Details - Always visible in Step 1, hidden in Step 2 */}
          {(currentStep === 1 || payout.status !== 'pending') && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Detalles del Retiro</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>Monto:</span>
                  <span className='text-lg font-semibold'>
                    {formatCurrency(payout.amount, payout.currency)}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>Moneda:</span>
                  <span className='text-sm font-medium'>{payout.currency}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settlement/Exchange Rate Information - Show when payout is in USD and we have settlement data */}
          {(currentStep === 1 || payout.status !== 'pending') &&
            payout.settlementInfo?.hasExchangeRateData &&
            payout.currency === 'USD' && (
              <Alert className='border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'>
                <ArrowRightLeft className='h-4 w-4 text-amber-600' />
                <AlertTitle className='text-amber-800 dark:text-amber-200'>
                  Información de Liquidación
                  {payout.settlementInfo.providers &&
                    payout.settlementInfo.providers.length > 0 &&
                    ` (${formatProvidersList(payout.settlementInfo.providers)})`}
                </AlertTitle>
                <AlertDescription className='text-amber-700 dark:text-amber-300'>
                  <div className='mt-2 space-y-2'>
                    <p className='text-sm'>
                      Este retiro es en <strong>USD</strong>, pero el procesador
                      de pagos nos liquidó en <strong>UYU</strong>. A
                      continuación se muestra la información del tipo de cambio
                      aplicado:
                    </p>
                    {payout.settlementInfo.settlements.map(
                      (settlement, idx) => (
                        <div
                          key={idx}
                          className='mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700'
                        >
                          <div className='grid grid-cols-2 gap-2 text-sm'>
                            <div>
                              <span className='text-muted-foreground'>
                                Monto al vendedor ({settlement.currency}):
                              </span>
                            </div>
                            <div className='text-right font-medium'>
                              {formatCurrency(
                                String(settlement.totalSellerAmount),
                                settlement.currency,
                              )}
                            </div>

                            {settlement.averageExchangeRate && (
                              <>
                                <div>
                                  <span className='text-muted-foreground'>
                                    Tipo de cambio promedio:
                                  </span>
                                </div>
                                <div className='text-right font-medium'>
                                  1 USD ={' '}
                                  {settlement.averageExchangeRate.toFixed(4)}{' '}
                                  UYU
                                </div>
                              </>
                            )}

                            {settlement.totalBalanceAmount > 0 && (
                              <>
                                <div>
                                  <span className='text-muted-foreground'>
                                    Recibido del procesador (UYU):
                                  </span>
                                </div>
                                <div className='text-right font-medium'>
                                  {formatCurrency(
                                    String(settlement.totalBalanceAmount),
                                    'UYU',
                                  )}
                                </div>

                                <div>
                                  <span className='text-muted-foreground'>
                                    Comisión del procesador (UYU):
                                  </span>
                                </div>
                                <div className='text-right font-medium text-red-600'>
                                  -{' '}
                                  {formatCurrency(
                                    String(settlement.totalBalanceFee),
                                    'UYU',
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {settlement.averageExchangeRate && (
                            <div className='mt-3 pt-3 border-t border-amber-200 dark:border-amber-700'>
                              <div className='flex justify-between items-center'>
                                <span className='text-sm font-medium'>
                                  Equivalente en UYU a pagar:
                                </span>
                                <span className='text-lg font-bold text-amber-800 dark:text-amber-200'>
                                  {formatCurrency(
                                    String(
                                      settlement.totalSellerAmount *
                                        settlement.averageExchangeRate,
                                    ),
                                    'UYU',
                                  )}
                                </span>
                              </div>
                              <p className='text-xs text-muted-foreground mt-1'>
                                Calculado usando el tipo de cambio promedio de
                                las transacciones
                              </p>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

          {/* Info note for UYU payouts */}
          {(currentStep === 1 || payout.status !== 'pending') &&
            payout.currency === 'UYU' && (
              <Alert>
                <Info className='h-4 w-4' />
                <AlertTitle>Retiro en UYU</AlertTitle>
                <AlertDescription>
                  Este retiro está en UYU, que es la misma moneda en la que el
                  procesador de pagos nos liquida. No hay conversión de moneda
                  necesaria.
                </AlertDescription>
              </Alert>
            )}

          {/* Payout Method Details - Prominent Display - Always visible in Step 1, hidden in Step 2 */}
          {(currentStep === 1 || payout.status !== 'pending') &&
            payoutMethod && (
              <Card className='border-2 border-primary/20 bg-primary/5'>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Información de Transferencia
                  </CardTitle>
                  <DialogDescription className='text-sm'>
                    Usa esta información para realizar la transferencia bancaria
                    o el envío de PayPal
                  </DialogDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Account Holder */}
                  <div className='p-3 bg-background rounded-lg border'>
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <Label className='text-xs text-muted-foreground mb-1 block'>
                          Titular de la Cuenta
                        </Label>
                        <p className='text-sm font-semibold'>
                          {payoutMethod.accountHolderName}{' '}
                          {payoutMethod.accountHolderSurname}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Uruguayan Bank Details */}
                  {payoutMethod.payoutType === 'uruguayan_bank' &&
                    uruguayanBankMetadata?.success && (
                      <>
                        {/* Bank Name */}
                        {bankName && (
                          <div className='p-3 bg-background rounded-lg border'>
                            <div className='flex justify-between items-start'>
                              <div className='flex-1'>
                                <Label className='text-xs text-muted-foreground mb-1 block'>
                                  Banco
                                </Label>
                                <p className='text-sm font-semibold'>
                                  {bankName}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Account Number with Copy Button */}
                        {accountNumber && (
                          <div className='p-3 bg-background rounded-lg border'>
                            <div className='flex justify-between items-start gap-2'>
                              <div className='flex-1 min-w-0'>
                                <Label className='text-xs text-muted-foreground mb-1 block'>
                                  Número de Cuenta
                                </Label>
                                <div className='flex items-center gap-2'>
                                  <p className='text-sm font-mono font-semibold break-all'>
                                    {accountNumber}
                                  </p>
                                </div>
                              </div>
                              <CopyButton
                                text={accountNumber}
                                variant='outline'
                                size='sm'
                                className='shrink-0'
                              />
                            </div>
                          </div>
                        )}

                        {/* Currency */}
                        <div className='p-3 bg-background rounded-lg border'>
                          <div className='flex justify-between items-start'>
                            <div className='flex-1'>
                              <Label className='text-xs text-muted-foreground mb-1 block'>
                                Moneda
                              </Label>
                              <p className='text-sm font-semibold'>
                                {payoutMethod.currency}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                  {/* PayPal Details */}
                  {payoutMethod.payoutType === 'paypal' &&
                    paypalMetadata?.success && (
                      <>
                        {/* PayPal Email with Copy Button */}
                        {email && (
                          <div className='p-3 bg-background rounded-lg border'>
                            <div className='flex justify-between items-start gap-2'>
                              <div className='flex-1 min-w-0'>
                                <Label className='text-xs text-muted-foreground mb-1 block'>
                                  Email de PayPal
                                </Label>
                                <div className='flex items-center gap-2'>
                                  <p className='text-sm font-semibold break-all'>
                                    {email}
                                  </p>
                                </div>
                              </div>
                              <CopyButton
                                text={email}
                                variant='outline'
                                size='sm'
                                className='shrink-0'
                              />
                            </div>
                          </div>
                        )}

                        {/* Currency */}
                        <div className='p-3 bg-background rounded-lg border'>
                          <div className='flex justify-between items-start'>
                            <div className='flex-1'>
                              <Label className='text-xs text-muted-foreground mb-1 block'>
                                Moneda
                              </Label>
                              <p className='text-sm font-semibold'>
                                {payoutMethod.currency}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                  {/* Fallback if metadata parsing fails */}
                  {!uruguayanBankMetadata?.success &&
                    !paypalMetadata?.success &&
                    payoutMethod.metadata && (
                      <div className='p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800'>
                        <p className='text-xs text-yellow-800 dark:text-yellow-200'>
                          ⚠️ No se pudo parsear la información del método de
                          pago. Por favor, revisa los detalles manualmente.
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

          {/* Step 2: Processing Form */}
          {currentStep === 2 && payout.status === 'pending' && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleProcess)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='processingFee'
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>
                        Comisión de Procesamiento (opcional)
                      </FormLabel>
                      <FormControl>
                        <PriceInput
                          placeholder='Ingresa la comisión'
                          value={field.value || 0}
                          onChange={field.onChange}
                          locale='es-ES'
                          currency={
                            (payout.currency as EventTicketCurrency) ??
                            EventTicketCurrency.UYU
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='transactionReference'
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>
                        Referencia de Transacción (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Referencia de transferencia bancaria'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='notes'
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Notas (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Notas adicionales...'
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Voucher Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Comprobante</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='voucherFile'>
                        Subir Comprobante (opcional)
                      </Label>
                      <div className='flex gap-2'>
                        <Input
                          id='voucherFile'
                          type='file'
                          accept='.pdf,.png,.jpg,.jpeg'
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                            }
                          }}
                          className='flex-1'
                        />
                        <Button
                          type='button'
                          onClick={handleUploadVoucher}
                          disabled={
                            !selectedFile || uploadDocumentMutation.isPending
                          }
                          variant='outline'
                        >
                          {uploadDocumentMutation.isPending ? (
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          ) : (
                            <Upload className='mr-2 h-4 w-4' />
                          )}
                          Subir
                        </Button>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Formatos permitidos: PDF, PNG, JPG, JPEG (máx. 10MB)
                      </p>
                    </div>

                    {/* Existing Documents */}
                    {payout.documents && payout.documents.length > 0 && (
                      <div className='space-y-2'>
                        <Label>
                          Comprobantes Subidos ({payout.documents.length})
                        </Label>
                        <div className='space-y-2'>
                          {payout.documents.map(doc => {
                            const FileIcon = getFileIcon(doc.mimeType);
                            return (
                              <div
                                key={doc.id}
                                className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                              >
                                <div className='flex items-center gap-3 flex-1 min-w-0'>
                                  <FileIcon className='h-5 w-5 text-muted-foreground shrink-0' />
                                  <div className='flex-1 min-w-0'>
                                    <p className='text-sm font-medium truncate'>
                                      {doc.originalName}
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                      {formatFileSize(doc.sizeBytes)}
                                    </p>
                                  </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => {
                                      window.open(doc.url, '_blank');
                                    }}
                                  >
                                    <Download className='h-4 w-4 mr-1' />
                                    Descargar
                                  </Button>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    disabled={deleteDocumentMutation.isPending}
                                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setCurrentStep(1)}
                    disabled={processMutation.isPending}
                  >
                    Atrás
                  </Button>
                  <Button type='submit' disabled={processMutation.isPending}>
                    {processMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Procesar Retiro
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Navigation buttons for Step 1 */}
          {currentStep === 1 && payout.status === 'pending' && (
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleDialogOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type='button' onClick={() => setCurrentStep(2)}>
                Siguiente
              </Button>
            </div>
          )}

          {/* Voucher Upload Section for completed payouts */}
          {payout.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Comprobantes</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Upload New Voucher */}
                <div className='space-y-2'>
                  <Label htmlFor='voucherFile'>Subir Comprobante</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='voucherFile'
                      type='file'
                      accept='.pdf,.png,.jpg,.jpeg'
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                        }
                      }}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      onClick={handleUploadVoucher}
                      disabled={
                        !selectedFile || uploadDocumentMutation.isPending
                      }
                    >
                      {uploadDocumentMutation.isPending ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <Upload className='mr-2 h-4 w-4' />
                      )}
                      Subir
                    </Button>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Formatos permitidos: PDF, PNG, JPG, JPEG (máx. 10MB)
                  </p>
                </div>

                {/* Existing Documents */}
                {payout.documents && payout.documents.length > 0 && (
                  <div className='space-y-2'>
                    <Label>
                      Comprobantes Subidos ({payout.documents.length})
                    </Label>
                    <div className='space-y-2'>
                      {payout.documents.map(doc => {
                        const FileIcon = getFileIcon(doc.mimeType);
                        return (
                          <div
                            key={doc.id}
                            className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                          >
                            <div className='flex items-center gap-3 flex-1 min-w-0'>
                              <FileIcon className='h-5 w-5 text-muted-foreground shrink-0' />
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium truncate'>
                                  {doc.originalName}
                                </p>
                                <p className='text-xs text-muted-foreground'>
                                  {formatFileSize(doc.sizeBytes)}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  window.open(doc.url, '_blank');
                                }}
                              >
                                <Download className='h-4 w-4 mr-1' />
                                Descargar
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={deleteDocumentMutation.isPending}
                                className='text-red-600 hover:text-red-700 hover:bg-red-50'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-destructive' />
              Confirmar Procesamiento de Retiro
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas procesar este retiro? Esta acción
              cambiará el estado del retiro a "procesando" y no se puede
              deshacer fácilmente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowConfirmDialog(false)}
              disabled={processMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              onClick={confirmProcess}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
