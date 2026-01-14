import {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {useForm, FormProvider} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {toast} from 'sonner';
import {api, verifyIdentityDocument} from '~/lib/api';
import {
  VerificationStepper,
  InfoStep,
  DocumentsStep,
  LivenessStep,
  CompleteStep,
  ManualReviewStep,
} from './steps';

const documentTypes = ['ci_uy', 'dni_ar', 'passport'] as const;
type DocumentType = (typeof documentTypes)[number];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

// Custom FileList schema that works with SSR (FileList is browser-only)
const fileListSchema = z
  .custom<FileList>(
    val => typeof window !== 'undefined' && val instanceof FileList,
    {message: 'Debe ser un archivo válido'},
  )
  .optional()
  .refine(files => {
    if (!files || files.length === 0) return true;
    const file = files[0];
    return file ? file.size <= MAX_FILE_SIZE : true;
  }, 'El archivo debe ser menor a 10MB')
  .refine(files => {
    if (!files || files.length === 0) return true;
    const file = files[0];
    return file ? ACCEPTED_IMAGE_TYPES.includes(file.type) : true;
  }, 'Solo se aceptan archivos .jpg, .jpeg, .png y .webp');

// Shared form schema for all steps
const verificationFormSchema = z
  .object({
    // Step 1: Info
    documentType: z.enum(documentTypes, {
      message: 'Selecciona un tipo de documento',
    }),
    documentNumber: z.string().min(1, 'El número de documento es requerido'),
    documentCountry: z.string().optional(),
    // Step 2: Document upload
    document: fileListSchema,
  })
  .refine(
    data => {
      if (data.documentType === 'passport') {
        return data.documentCountry && data.documentCountry.length > 0;
      }
      return true;
    },
    {
      message: 'Selecciona el país del pasaporte',
      path: ['documentCountry'],
    },
  );

export type VerificationFormValues = z.infer<typeof verificationFormSchema>;

interface ExistingDocumentInfo {
  documentType: 'ci_uy' | 'dni_ar' | 'passport';
  documentNumber: string;
  documentCountry?: string;
}

interface IdentityVerificationFlowProps {
  onComplete: () => void;
  existingDocumentInfo?: ExistingDocumentInfo;
  /** Whether user has already uploaded their document (step 2 completed) */
  hasDocumentImage?: boolean;
  /** Whether document verification step was completed successfully */
  documentVerificationCompleted?: boolean;
  /** Existing liveness session ID for resuming on different device */
  verificationSessionId?: string | null;
  /** Current verification status from user data */
  verificationStatus?:
    | 'pending'
    | 'completed'
    | 'requires_manual_review'
    | 'failed'
    | 'rejected'
    | null;
  /** Number of verification attempts used */
  verificationAttempts?: number;
  /** Whether user can retry liveness */
  canRetryLiveness?: boolean;
}

type Step = 'info' | 'documents' | 'liveness' | 'complete' | 'manual_review';

function determineInitialStep(props: {
  existingDocumentInfo?: ExistingDocumentInfo;
  hasDocumentImage?: boolean;
  documentVerificationCompleted?: boolean;
  verificationSessionId?: string | null;
  verificationStatus?:
    | 'pending'
    | 'completed'
    | 'requires_manual_review'
    | 'failed'
    | 'rejected'
    | null;
  canRetryLiveness?: boolean;
}): Step {
  const {
    existingDocumentInfo,
    hasDocumentImage,
    documentVerificationCompleted,
    verificationSessionId,
    verificationStatus,
    canRetryLiveness,
  } = props;

  // If verification is complete, show complete step
  if (verificationStatus === 'completed') {
    return 'complete';
  }

  // If verification requires manual review, show that step
  if (verificationStatus === 'requires_manual_review') {
    return 'manual_review';
  }

  // If verification failed and user can't retry, show failure
  // (handled by the liveness step with failure state)
  if (verificationStatus === 'failed' && !canRetryLiveness) {
    return 'liveness'; // Will show failure card
  }

  // If verification was rejected by admin and user can retry, start fresh from info
  // (they may need to provide new/different documents)
  if (verificationStatus === 'rejected' && canRetryLiveness) {
    return 'info';
  }

  // If rejected and can't retry (shouldn't happen but handle gracefully)
  if (verificationStatus === 'rejected' && !canRetryLiveness) {
    return 'liveness'; // Will show failure card
  }

  // If document verification is completed (text/face detected), go to liveness
  // This handles the case where user completed document step but hasn't done liveness yet
  // Also handles retry scenario where user can try liveness again
  if (documentVerificationCompleted) {
    return 'liveness';
  }

  // If user has document image AND session ID, they're ready for liveness
  // (legacy check for backwards compatibility)
  if (hasDocumentImage && verificationSessionId) {
    return 'liveness';
  }

  // If user has document info but no image, they need to upload document
  if (existingDocumentInfo) {
    return 'documents';
  }

  // Otherwise, start from the beginning
  return 'info';
}

export function IdentityVerificationFlow({
  onComplete,
  existingDocumentInfo,
  hasDocumentImage,
  documentVerificationCompleted,
  verificationSessionId: existingSessionId,
  verificationStatus,
  verificationAttempts = 0,
  canRetryLiveness = true,
}: IdentityVerificationFlowProps) {
  const initialStep = determineInitialStep({
    existingDocumentInfo,
    hasDocumentImage,
    documentVerificationCompleted,
    verificationSessionId: existingSessionId,
    verificationStatus,
    canRetryLiveness,
  });

  const [step, setStep] = useState<Step>(initialStep);
  const [sessionId, setSessionId] = useState<string | undefined>(
    existingSessionId ?? undefined,
  );
  const [livenessRegion, setLivenessRegion] = useState<string | undefined>(
    existingSessionId ? 'us-west-2' : undefined,
  );

  // Liveness verification state
  const [isVerifyingLiveness, setIsVerifyingLiveness] = useState(false);
  const [livenessVerificationFailed, setLivenessVerificationFailed] =
    useState(false);
  const [livenessFailureMessage, setLivenessFailureMessage] = useState<
    string | undefined
  >();

  // Shared form state for all steps
  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      documentType: existingDocumentInfo?.documentType ?? undefined,
      documentNumber: existingDocumentInfo?.documentNumber ?? '',
      documentCountry: existingDocumentInfo?.documentCountry ?? '',
      document: undefined,
    },
    mode: 'onChange',
  });

  // Mutations
  const initiateMutation = useMutation({
    mutationFn: (data: {
      documentType: DocumentType;
      documentNumber: string;
      documentCountry?: string;
    }) =>
      api.identityVerification.initiateVerification(data).then(res => res.data),
    onSuccess: () => {
      setStep('documents');
    },
  });

  const verifyDocumentMutation = useMutation({
    mutationFn: async (data: {documentType: DocumentType; document: File}) => {
      return verifyIdentityDocument({
        file: data.document,
        documentType: data.documentType,
      });
    },
    onSuccess: data => {
      if (data.readyForLiveness) {
        // Go to liveness step - session will be created by LivenessStep when user clicks "Start"
        // This avoids creating sessions that might expire before user is ready
        setStep('liveness');
      }
    },
  });

  const verifyLivenessMutation = useMutation({
    mutationFn: (sessionId: string) =>
      api.identityVerification
        .verifyLiveness({sessionId})
        .then(res => res.data),
    onSuccess: data => {
      setIsVerifyingLiveness(false);
      if (data.status === 'completed') {
        setLivenessVerificationFailed(false);
        setStep('complete');
        toast.success('Verificación completada exitosamente');
        setTimeout(() => onComplete(), 2000);
      } else if (data.status === 'requires_manual_review') {
        setLivenessVerificationFailed(false);
        setStep('manual_review');
      } else if (data.canRetry) {
        // Borderline - offer retry with generic message (never disclose scores per AWS guidelines)
        setLivenessVerificationFailed(true);
        const retriesText =
          data.retriesRemaining !== undefined
            ? ` Te quedan ${data.retriesRemaining} intento${data.retriesRemaining !== 1 ? 's' : ''}.`
            : '';
        setLivenessFailureMessage(
          `No pudimos verificar tu identidad. Probá de nuevo asegurándote de tener buena luz y tu cara bien centrada.${retriesText}`,
        );
        // Clear session so user can create a new one
        setSessionId(undefined);
        setLivenessRegion(undefined);
        toast.info('Podés intentar de nuevo');
      } else {
        // Verification failed - show generic error (never disclose scores per AWS guidelines)
        setLivenessVerificationFailed(true);
        setLivenessFailureMessage(
          'No pudimos verificar tu identidad. Asegurate de tener buena luz, mantener tu cara centrada y seguir las instrucciones en pantalla.',
        );
        toast.error('No pudimos verificarte');
      }
    },
    onError: error => {
      setIsVerifyingLiveness(false);
      setLivenessVerificationFailed(true);
      setLivenessFailureMessage(
        'Error de conexión. Por favor, intentá de nuevo.',
      );
      toast.error('Error de conexión');
      console.error('Identity verification error:', error);
    },
  });

  // Handlers
  const handleInfoSubmit = () => {
    const values = form.getValues();
    initiateMutation.mutate({
      documentType: values.documentType,
      documentNumber: values.documentNumber,
      // Only include documentCountry if it has a value (passports only)
      documentCountry: values.documentCountry || undefined,
    });
  };

  const handleDocumentsSubmit = () => {
    const values = form.getValues();
    const document = values.document?.[0];
    if (!document) {
      toast.error('Selecciona un documento');
      return;
    }
    verifyDocumentMutation.mutate({
      documentType: values.documentType,
      document,
    });
  };

  const handleLivenessComplete = () => {
    if (sessionId) {
      setIsVerifyingLiveness(true);
      setLivenessVerificationFailed(false);
      verifyLivenessMutation.mutate(sessionId);
    }
  };

  const handleLivenessRetry = () => {
    // Reset liveness state to allow a new attempt
    setLivenessVerificationFailed(false);
    setLivenessFailureMessage(undefined);
    setSessionId(undefined);
    setLivenessRegion(undefined);
    // The LivenessStep will automatically request a new session
  };

  const handleSessionCreated = (newSessionId: string, region: string) => {
    // LivenessStep created a session - store it for verify call
    setSessionId(newSessionId);
    setLivenessRegion(region);
  };

  // Back navigation handlers
  const handleBackToInfo = () => {
    setStep('info');
  };

  const handleBackToDocuments = () => {
    setStep('documents');
  };

  return (
    <FormProvider {...form}>
      <div className='verification-flow max-w-2xl mx-auto'>
        <VerificationStepper step={step} />

        {step === 'info' && (
          <InfoStep
            onSubmit={handleInfoSubmit}
            isPending={initiateMutation.isPending}
          />
        )}

        {step === 'documents' && (
          <DocumentsStep
            onSubmit={handleDocumentsSubmit}
            onBack={handleBackToInfo}
            isPending={verifyDocumentMutation.isPending}
          />
        )}

        {step === 'liveness' && (
          <LivenessStep
            sessionId={sessionId}
            livenessRegion={livenessRegion}
            onComplete={handleLivenessComplete}
            onBack={handleBackToDocuments}
            onSessionCreated={handleSessionCreated}
            isVerifying={isVerifyingLiveness}
            verificationFailed={livenessVerificationFailed}
            failureMessage={livenessFailureMessage}
            onRetry={handleLivenessRetry}
          />
        )}

        {step === 'complete' && <CompleteStep />}

        {step === 'manual_review' && <ManualReviewStep />}
      </div>
    </FormProvider>
  );
}
