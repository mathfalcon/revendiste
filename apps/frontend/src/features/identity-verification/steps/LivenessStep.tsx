import {useCallback} from 'react';
import {
  LivenessErrorCard,
  LivenessFailureCard,
  LivenessInstructionsCard,
  LivenessSecureContextError,
  LivenessVerifyingCard,
  LivenessDialog,
  useLivenessSession,
} from './liveness';

interface LivenessStepProps {
  sessionId?: string;
  livenessRegion?: string;
  onComplete: () => void;
  onBack: () => void;
  onSessionCreated?: (sessionId: string, region: string) => void;
  /** Whether the backend is currently verifying the liveness result */
  isVerifying?: boolean;
  /** If verification failed, show error and allow retry */
  verificationFailed?: boolean;
  failureMessage?: string;
  onRetry?: () => void;
}

export function LivenessStep({
  sessionId: initialSessionId,
  livenessRegion: initialRegion,
  onComplete,
  onBack,
  onSessionCreated,
  isVerifying = false,
  verificationFailed = false,
  failureMessage,
  onRetry,
}: LivenessStepProps) {
  const {
    sessionId,
    livenessRegion,
    credentials,
    livenessError,
    attemptsRemaining,
    maxAttemptsReached,
    isDialogOpen,
    isLoading,
    startVerification,
    resetSession,
    closeDialog,
    handleLivenessError,
    handleUserCancel,
  } = useLivenessSession({
    initialSessionId,
    initialRegion,
    onSessionCreated,
  });

  // Check if we're in a secure context (HTTPS required for camera access)
  const isSecureContext =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  const hasMediaDevices =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices;

  const handleAnalysisComplete = useCallback(async () => {
    closeDialog();
    onComplete();
  }, [closeDialog, onComplete]);

  const handleDialogClose = useCallback(() => {
    if (isVerifying) return;
    closeDialog();
  }, [isVerifying, closeDialog]);

  // Show verifying state while backend processes liveness result
  if (isVerifying) {
    return <LivenessVerifyingCard />;
  }

  // Show failure state with retry option
  if (verificationFailed) {
    return (
      <LivenessFailureCard
        failureMessage={failureMessage}
        onBack={onBack}
        onRetry={onRetry}
      />
    );
  }

  // Show error state
  if (livenessError) {
    return (
      <LivenessErrorCard
        error={livenessError}
        attemptsRemaining={attemptsRemaining}
        maxAttemptsReached={maxAttemptsReached}
        onBack={onBack}
        onRetry={resetSession}
      />
    );
  }

  // Show error if not in secure context (HTTPS required for camera)
  if (!isSecureContext || !hasMediaDevices) {
    return <LivenessSecureContextError />;
  }

  return (
    <>
      <LivenessInstructionsCard
        onBack={onBack}
        onStartVerification={startVerification}
        isLoading={isLoading}
      />

      <LivenessDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        sessionId={sessionId}
        region={livenessRegion}
        credentials={credentials}
        onAnalysisComplete={handleAnalysisComplete}
        onError={handleLivenessError}
        onUserCancel={handleUserCancel}
        isVerifying={isVerifying}
      />
    </>
  );
}
