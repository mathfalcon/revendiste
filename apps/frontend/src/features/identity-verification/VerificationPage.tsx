import {useQuery} from '@tanstack/react-query';
import {getCurrentUserQuery} from '~/lib';
import {VerificationLoading} from './VerificationLoading';
import {VerificationSuccess} from './VerificationSuccess';
import {VerificationFailed} from './VerificationFailed';
import {VerificationPending} from './VerificationPending';

export function VerificationPage() {
  const {data: user, isLoading, refetch} = useQuery(getCurrentUserQuery());

  const handleVerificationComplete = () => {
    refetch();
  };

  // Show loading state while fetching user data
  if (isLoading) {
    return <VerificationLoading />;
  }

  // User is already verified
  if (user?.documentVerified) {
    return <VerificationSuccess />;
  }

  // User verification was rejected by admin
  if (user?.verificationStatus === 'rejected') {
    return (
      <VerificationFailed
        onComplete={handleVerificationComplete}
        rejectionReason={user.rejectionReason ?? undefined}
        canRetry={user.canRetryLiveness}
      />
    );
  }

  // User verification failed and cannot retry (exhausted attempts)
  if (user?.verificationStatus === 'failed' && !user?.canRetryLiveness) {
    return (
      <VerificationFailed onComplete={handleVerificationComplete} canRetry={false} />
    );
  }

  // Note: 'requires_manual_review' status is handled by IdentityVerificationFlow
  // which shows the ManualReviewStep with the stepper context

  // User needs to verify (pending or null) OR failed but can retry
  return (
    <VerificationPending
      onComplete={handleVerificationComplete}
      existingDocumentInfo={
        user?.documentType && user?.documentNumber
          ? {
              documentType: user.documentType as
                | 'ci_uy'
                | 'dni_ar'
                | 'passport',
              documentNumber: user.documentNumber,
              documentCountry: user.documentCountry ?? undefined,
            }
          : undefined
      }
      hasDocumentImage={user?.hasDocumentImage}
      documentVerificationCompleted={user?.documentVerificationCompleted}
      verificationSessionId={user?.verificationSessionId}
      verificationStatus={user?.verificationStatus}
      verificationAttempts={user?.verificationAttempts}
      canRetryLiveness={user?.canRetryLiveness}
    />
  );
}
