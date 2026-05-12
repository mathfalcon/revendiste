import {Check} from 'lucide-react';
import {cn} from '~/lib/utils';

export interface PayoutStep {
  id: number;
  label: string;
  shortLabel: string;
}

export const PAYOUT_STEPS: PayoutStep[] = [
  {id: 1, label: 'Tipo de cambio', shortLabel: 'FX'},
  {id: 2, label: 'Datos de transferencia', shortLabel: 'Destino'},
  {id: 3, label: 'Comprobante', shortLabel: 'Voucher'},
  {id: 4, label: 'Confirmar', shortLabel: 'Confirmar'},
];

interface PayoutStepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function PayoutStepIndicator({
  currentStep,
  onStepClick,
}: PayoutStepIndicatorProps) {
  return (
    <nav aria-label='Progreso del retiro' className='w-full'>
      <ol className='flex items-center gap-0'>
        {PAYOUT_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = step.id <= currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex flex-1 items-center',
                index < PAYOUT_STEPS.length - 1 && 'after:ml-2 after:flex-1',
              )}
            >
              <button
                type='button'
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors sm:px-3',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default',
                  isCurrent &&
                    'bg-primary/10 font-medium text-primary',
                  isCompleted &&
                    'text-muted-foreground hover:text-foreground',
                  !isCurrent &&
                    !isCompleted &&
                    'text-muted-foreground/50',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                    isCurrent &&
                      'border-primary bg-primary text-primary-foreground',
                    isCompleted &&
                      'border-green-600 bg-green-500/10 text-green-700 dark:text-green-400',
                    !isCurrent &&
                      !isCompleted &&
                      'border-muted-foreground/30 text-muted-foreground/50',
                  )}
                >
                  {isCompleted ? (
                    <Check className='h-3.5 w-3.5' />
                  ) : (
                    step.id
                  )}
                </span>
                <span className='hidden whitespace-nowrap sm:inline'>
                  {step.label}
                </span>
                <span className='whitespace-nowrap sm:hidden'>
                  {step.shortLabel}
                </span>
              </button>

              {index < PAYOUT_STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-px flex-1 transition-colors sm:mx-2',
                    isCompleted ? 'bg-green-500/40' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
