type Step = 'info' | 'documents' | 'liveness' | 'complete' | 'manual_review';

interface VerificationStepperProps {
  step: Step;
}

export function VerificationStepper({step}: VerificationStepperProps) {
  const steps = ['Información', 'Documento', 'Verificación'];

  const getStepIndex = () => {
    if (step === 'info') return 0;
    if (step === 'documents') return 1;
    return 2;
  };

  const currentIndex = getStepIndex();

  return (
    <div className='mb-8 max-w-md mx-auto'>
      <div className='flex items-center'>
        {steps.map((name, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <div key={name} className='flex items-center flex-1 last:flex-none'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                  isCompleted
                    ? 'bg-green-400 text-white'
                    : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className='ml-2 text-sm font-medium hidden sm:inline whitespace-nowrap'>
                {name}
              </span>
              {index < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 sm:mx-4 min-w-4 ${
                    isCompleted ? 'bg-green-400' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Mobile: Show current step name below */}
      <p className='text-center text-sm text-muted-foreground mt-3 sm:hidden'>
        {step === 'info' && 'Paso 1: Información'}
        {step === 'documents' && 'Paso 2: Documento'}
        {['liveness', 'complete', 'manual_review'].includes(step) &&
          'Paso 3: Verificación'}
      </p>
    </div>
  );
}
