import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
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
import {PriceInput} from '~/components/ui/price-input';
import {EventTicketCurrency} from '~/lib';
import {
  adminPayoutDetailsQueryOptions,
  processPayoutMutation,
  uploadPayoutDocumentMutation,
  deletePayoutDocumentMutation,
} from '~/lib/api/admin';
import {toast} from 'sonner';
import {Loader2, Upload, Trash2, Download, AlertTriangle} from 'lucide-react';
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

  const [processingFee, setProcessingFee] = useState<number>(0);
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Reset step when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentStep(1);
    }
    onOpenChange(open);
  };

  const processMutation = useMutation({
    ...processPayoutMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts', payoutId]});
      toast.success('Pago procesado exitosamente');
      // Reset form
      setProcessingFee(0);
      setTransactionReference('');
      setNotes('');
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al procesar el pago');
    },
  });

  const uploadDocumentMutation = useMutation({
    ...uploadPayoutDocumentMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts', payoutId]});
      toast.success('Comprobante subido exitosamente');
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
      toast.success('Comprobante eliminado exitosamente');
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

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    // Show confirmation dialog instead of processing immediately
    setShowConfirmDialog(true);
  };

  const confirmProcess = () => {
    // Build updates object, always send at least an empty object
    const updates: {
      processingFee?: number;
      transactionReference?: string;
      notes?: string;
    } = {};

    if (processingFee && processingFee > 0) {
      updates.processingFee = processingFee;
    }
    if (transactionReference && transactionReference.trim() !== '') {
      updates.transactionReference = transactionReference.trim();
    }
    if (notes && notes.trim() !== '') {
      updates.notes = notes.trim();
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
              ? 'Revisa los detalles del pago y la información de transferencia antes de continuar.'
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
                  Detalles del Pago
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
                <CardTitle className='text-base'>Detalles del Pago</CardTitle>
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
                                className='flex-shrink-0'
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
                                className='flex-shrink-0'
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
            <form onSubmit={handleProcess} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='processingFee'>
                  Comisión de Procesamiento (opcional)
                </Label>
                <PriceInput
                  id='processingFee'
                  placeholder='Ingresa la comisión'
                  value={processingFee}
                  onChange={setProcessingFee}
                  locale='es-ES'
                  currency={
                    (payout.currency as EventTicketCurrency) ??
                    EventTicketCurrency.UYU
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='transactionReference'>
                  Referencia de Transacción (opcional)
                </Label>
                <Input
                  id='transactionReference'
                  value={transactionReference}
                  onChange={e => setTransactionReference(e.target.value)}
                  placeholder='Referencia de transferencia bancaria'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='notes'>Notas (opcional)</Label>
                <Textarea
                  id='notes'
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder='Notas adicionales...'
                  rows={3}
                />
              </div>

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
                  Procesar Pago
                </Button>
              </div>
            </form>
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

          {/* Voucher Upload Section */}
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
              Confirmar Procesamiento de Pago
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas procesar este pago? Esta acción
              cambiará el estado del pago a "procesando" y no se puede deshacer
              fácilmente.
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
