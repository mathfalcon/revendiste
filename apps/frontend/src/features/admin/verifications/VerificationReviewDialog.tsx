import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {Textarea} from '~/components/ui/textarea';
import {Label} from '~/components/ui/label';
import {Badge} from '~/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {
  adminVerificationDetailsQueryOptions,
  adminVerificationImageQueryOptions,
  approveVerificationMutation,
  rejectVerificationMutation,
} from '~/lib/api/admin';
import {Loader2, CheckCircle, XCircle, AlertCircle, Image} from 'lucide-react';

interface VerificationReviewDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerificationReviewDialog({
  userId,
  open,
  onOpenChange,
}: VerificationReviewDialogProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const {data: details, isLoading} = useQuery(
    adminVerificationDetailsQueryOptions(userId),
  );

  const approveMutation = useMutation({
    ...approveVerificationMutation(),
    onSuccess: () => {
      toast.success('Verificación aprobada exitosamente');
      queryClient.invalidateQueries({queryKey: ['admin', 'verifications']});
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al aprobar la verificación');
    },
  });

  const rejectMutation = useMutation({
    ...rejectVerificationMutation(),
    onSuccess: () => {
      toast.success('Verificación rechazada');
      queryClient.invalidateQueries({queryKey: ['admin', 'verifications']});
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al rechazar la verificación');
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({userId, notes: notes || undefined});
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Debe proporcionar un motivo de rechazo');
      return;
    }
    rejectMutation.mutate({userId, reason: rejectReason});
  };

  const isManualReview = details?.verificationStatus === 'requires_manual_review';
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Revisar Verificación de Identidad</DialogTitle>
          <DialogDescription>
            Revisa los documentos y datos del usuario antes de aprobar o
            rechazar la verificación.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : details ? (
          <div className='space-y-6'>
            {/* User Info */}
            <div className='grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg'>
              <div>
                <Label className='text-muted-foreground'>Usuario</Label>
                <p className='font-medium'>
                  {details.firstName} {details.lastName}
                </p>
                <p className='text-sm text-muted-foreground'>{details.email}</p>
              </div>
              <div>
                <Label className='text-muted-foreground'>Documento</Label>
                <p className='font-medium'>
                  {details.documentType === 'ci_uy'
                    ? 'CI Uruguay'
                    : details.documentType === 'dni_ar'
                      ? 'DNI Argentina'
                      : 'Pasaporte'}
                </p>
                <p className='text-sm font-mono'>{details.documentNumber}</p>
                {details.documentCountry && (
                  <p className='text-sm text-muted-foreground'>
                    País: {details.documentCountry}
                  </p>
                )}
              </div>
            </div>

            {/* Status & Scores */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='p-4 border rounded-lg'>
                <Label className='text-muted-foreground'>Estado</Label>
                <div className='mt-2'>
                  <Badge
                    variant={
                      details.verificationStatus === 'requires_manual_review'
                        ? 'outline'
                        : details.verificationStatus === 'completed'
                          ? 'default'
                          : 'destructive'
                    }
                    className={
                      details.verificationStatus === 'requires_manual_review'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-700'
                        : ''
                    }
                  >
                    {details.verificationStatus === 'requires_manual_review'
                      ? 'Revisión Manual'
                      : details.verificationStatus === 'completed'
                        ? 'Completado'
                        : details.verificationStatus === 'failed'
                          ? 'Fallido'
                          : details.verificationStatus}
                  </Badge>
                </div>
                {details.manualReviewReason && (
                  <p className='mt-2 text-sm text-muted-foreground'>
                    <strong>Motivo:</strong> {details.manualReviewReason}
                  </p>
                )}
              </div>

              <div className='p-4 border rounded-lg'>
                <Label className='text-muted-foreground'>
                  Puntuaciones de Confianza
                </Label>
                <div className='mt-2 space-y-2'>
                  <ConfidenceScore
                    label='Detección de Texto'
                    value={details.confidenceScores.textDetection}
                    threshold={80}
                  />
                  <ConfidenceScore
                    label='Coincidencia Facial'
                    value={details.confidenceScores.faceMatch}
                    threshold={95}
                  />
                  <ConfidenceScore
                    label='Liveness'
                    value={details.confidenceScores.liveness}
                    threshold={95}
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <Tabs defaultValue='document' className='w-full'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='document'>
                  Documento
                  {!details.images.hasDocumentImage && (
                    <span className='ml-1 text-xs text-muted-foreground'>
                      (sin imagen)
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value='reference'>
                  Referencia
                  {!details.images.hasReferenceImage && (
                    <span className='ml-1 text-xs text-muted-foreground'>
                      (sin imagen)
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value='audit'
                  disabled={details.images.auditImagesCount === 0}
                >
                  Auditoría ({details.images.auditImagesCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='document' className='mt-4'>
                {details.images.hasDocumentImage ? (
                  <VerificationImage userId={userId} imageType='document' />
                ) : (
                  <NoImagePlaceholder />
                )}
              </TabsContent>

              <TabsContent value='reference' className='mt-4'>
                {details.images.hasReferenceImage ? (
                  <VerificationImage userId={userId} imageType='reference' />
                ) : (
                  <NoImagePlaceholder />
                )}
              </TabsContent>

              <TabsContent value='audit' className='mt-4'>
                {details.images.auditImagesCount > 0 ? (
                  <div className='grid grid-cols-2 gap-4'>
                    {Array.from({length: details.images.auditImagesCount}).map(
                      (_, index) => (
                        <VerificationImage
                          key={index}
                          userId={userId}
                          imageType='audit'
                          index={index}
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <NoImagePlaceholder />
                )}
              </TabsContent>
            </Tabs>

            {/* Actions */}
            {isManualReview && (
              <div className='space-y-4 pt-4 border-t'>
                {action === null && (
                  <div className='flex gap-4'>
                    <Button
                      variant='default'
                      className='flex-1 bg-green-600 hover:bg-green-700'
                      onClick={() => setAction('approve')}
                    >
                      <CheckCircle className='mr-2 h-4 w-4' />
                      Aprobar Verificación
                    </Button>
                    <Button
                      variant='destructive'
                      className='flex-1'
                      onClick={() => setAction('reject')}
                    >
                      <XCircle className='mr-2 h-4 w-4' />
                      Rechazar Verificación
                    </Button>
                  </div>
                )}

                {action === 'approve' && (
                  <div className='space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg'>
                    <div className='flex items-center gap-2 text-green-700 dark:text-green-400'>
                      <CheckCircle className='h-5 w-5' />
                      <span className='font-medium'>Aprobar Verificación</span>
                    </div>
                    <div>
                      <Label htmlFor='notes'>Notas (opcional)</Label>
                      <Textarea
                        id='notes'
                        placeholder='Agregar notas sobre la aprobación...'
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className='mt-2'
                      />
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        onClick={() => setAction(null)}
                        disabled={isPending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className='bg-green-600 hover:bg-green-700'
                        onClick={handleApprove}
                        disabled={isPending}
                      >
                        {isPending && (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        )}
                        Confirmar Aprobación
                      </Button>
                    </div>
                  </div>
                )}

                {action === 'reject' && (
                  <div className='space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg'>
                    <div className='flex items-center gap-2 text-red-700 dark:text-red-400'>
                      <XCircle className='h-5 w-5' />
                      <span className='font-medium'>Rechazar Verificación</span>
                    </div>
                    <div>
                      <Label htmlFor='rejectReason'>
                        Motivo del rechazo <span className='text-red-500'>*</span>
                      </Label>
                      <Textarea
                        id='rejectReason'
                        placeholder='Explica el motivo del rechazo...'
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className='mt-2'
                        required
                      />
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        onClick={() => setAction(null)}
                        disabled={isPending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant='destructive'
                        onClick={handleReject}
                        disabled={isPending || !rejectReason.trim()}
                      >
                        {isPending && (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        )}
                        Confirmar Rechazo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className='flex items-center justify-center py-12 text-muted-foreground'>
            <AlertCircle className='mr-2 h-5 w-5' />
            No se encontró información de verificación
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfidenceScore({
  label,
  value,
  threshold,
}: {
  label: string;
  value: number | null;
  threshold: number;
}) {
  if (value === null) {
    return (
      <div className='flex justify-between text-sm'>
        <span>{label}</span>
        <span className='text-muted-foreground'>-</span>
      </div>
    );
  }

  const isGood = value >= threshold;
  const isBorderline = value >= threshold - 10 && value < threshold;

  return (
    <div className='flex justify-between text-sm'>
      <span>{label}</span>
      <span
        className={
          isGood
            ? 'text-green-600 font-medium'
            : isBorderline
              ? 'text-yellow-600 font-medium'
              : 'text-red-600 font-medium'
        }
      >
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function VerificationImage({
  userId,
  imageType,
  index,
}: {
  userId: string;
  imageType: 'document' | 'reference' | 'audit';
  index?: number;
}) {
  const {data, isLoading, error} = useQuery(
    adminVerificationImageQueryOptions(userId, imageType, index),
  );

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64 bg-muted rounded-lg'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error || !data?.url) {
    return (
      <div className='flex items-center justify-center h-64 bg-muted rounded-lg text-muted-foreground'>
        <AlertCircle className='mr-2 h-5 w-5' />
        Error al cargar imagen
      </div>
    );
  }

  return (
    <div className='relative'>
      <img
        src={data.url}
        alt={`${imageType} image${index !== undefined ? ` ${index + 1}` : ''}`}
        className='w-full h-auto max-h-[400px] object-contain rounded-lg border'
      />
      {index !== undefined && (
        <Badge className='absolute top-2 left-2' variant='secondary'>
          Auditoría {index + 1}
        </Badge>
      )}
    </div>
  );
}

function NoImagePlaceholder() {
  return (
    <div className='flex flex-col items-center justify-center h-64 bg-muted rounded-lg text-muted-foreground'>
      <Image className='h-12 w-12 mb-2' />
      <span>No hay imagen disponible</span>
    </div>
  );
}
