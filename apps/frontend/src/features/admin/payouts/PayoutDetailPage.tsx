import {useState} from 'react';
import {Link, useNavigate} from '@tanstack/react-router';
import {useMutation, useQueryClient, useSuspenseQuery} from '@tanstack/react-query';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {CopyButton} from '~/components/ui/copy-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  adminPayoutDetailsQueryOptions,
  processPayoutMutation,
} from '~/lib/api/admin';
import {CancelPayoutDialog} from './CancelPayoutDialog';
import {PayoutStepIndicator} from './PayoutStepIndicator';
import {StepFxReview} from './StepFxReview';
import {StepTransferDetails} from './StepTransferDetails';
import {StepUploadVoucher} from './StepUploadVoucher';
import {StepConfirmComplete} from './StepConfirmComplete';
import {PayoutCompletedSummary} from './PayoutCompletedSummary';
import {statusBadge, providerLabel, formatAge} from './payout-utils';
import {formatCurrency} from '~/utils';
import {ArrowLeft, Ban, MoreHorizontal} from 'lucide-react';
import {toast} from 'sonner';

interface PayoutDetailPageProps {
  payoutId: string;
}

export function PayoutDetailPage({payoutId}: PayoutDetailPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {data: payout} = useSuspenseQuery(
    adminPayoutDetailsQueryOptions(payoutId),
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [cancelOpen, setCancelOpen] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
    void queryClient.invalidateQueries({
      queryKey: ['admin', 'payouts', payoutId],
    });
  };

  const processMutation = useMutation({
    ...processPayoutMutation(),
    onSuccess: () => {
      invalidate();
      toast.success('Retiro procesado');
      void navigate({to: '/admin/retiros'});
    },
    onError: (error: {response?: {data?: {message?: string}}}) => {
      toast.error(
        error.response?.data?.message || 'Error al procesar el retiro',
      );
    },
  });

  const isPending = payout.status === 'pending';

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div className='rounded-xl border bg-card shadow-sm'>
        <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6'>
          <div className='flex min-w-0 items-start gap-3'>
            <Button variant='outline' size='icon' className='shrink-0 cursor-pointer' asChild>
              <Link to='/admin/retiros' aria-label='Volver a retiros'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div className='min-w-0'>
              <h1 className='text-xl font-semibold tracking-tight sm:text-2xl'>
                Retiro
              </h1>
              <div className='mt-1 flex flex-wrap items-center gap-2'>
                <span
                  className='font-mono text-xs text-muted-foreground truncate max-w-[min(100%,280px)] sm:max-w-md'
                  title={payout.id}
                >
                  {payout.id}
                </span>
                <CopyButton text={payout.id} size='sm' />
              </div>
              <p className='mt-2 text-xs text-muted-foreground'>
                Solicitado hace {formatAge(payout.requestedAt)} ·{' '}
                {new Date(payout.requestedAt).toLocaleString('es-UY')}
              </p>
            </div>
          </div>
          <div className='flex flex-col gap-2 sm:items-end'>
            <p className='text-2xl font-bold tabular-nums sm:text-3xl'>
              {formatCurrency(payout.amount, payout.currency)}
            </p>
            <div className='flex flex-wrap gap-2 sm:justify-end'>
              {statusBadge(payout.status)}
              <Badge variant='outline' className='capitalize'>
                {providerLabel(payout.payoutProvider)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions for pending payouts */}
        {isPending && (
          <div className='flex items-center justify-between gap-2 border-t px-4 py-2.5'>
            <span className='text-xs text-muted-foreground'>
              Paso {currentStep} de 4
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='cursor-pointer'
                  aria-label='Más acciones'
                >
                  <MoreHorizontal className='h-4 w-4' />
                  <span className='ml-1.5 hidden sm:inline'>Más acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuItem
                  className='cursor-pointer'
                  onClick={() => setCancelOpen(true)}
                >
                  <Ban className='mr-2 h-4 w-4' />
                  Cancelar solicitud
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Wizard or read-only view */}
      {isPending ? (
        <div className='space-y-5'>
          <PayoutStepIndicator
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />

          {currentStep === 1 && (
            <StepFxReview
              payoutId={payoutId}
              payout={payout}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <StepTransferDetails
              payout={payout}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StepUploadVoucher
              payoutId={payoutId}
              payout={payout}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <StepConfirmComplete
              payout={payout}
              onBack={() => setCurrentStep(3)}
              onConfirm={updates =>
                processMutation.mutate({payoutId, updates})
              }
              isProcessing={processMutation.isPending}
            />
          )}
        </div>
      ) : (
        <PayoutCompletedSummary payout={payout} />
      )}

      {/* Shared dialogs */}
      <CancelPayoutDialog
        payoutId={payoutId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onCancelled={() => void navigate({to: '/admin/retiros'})}
      />
    </div>
  );
}
