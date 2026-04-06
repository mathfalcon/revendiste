import {useState, useCallback, useEffect} from 'react';
import {useQuery, useMutation} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {api} from '~/lib/api';
import {
  ErrorClassName,
  type CreateLivenessCheckResponse,
  type ApiErrorResponse,
} from '~/lib/api/generated';

interface UseLivenessSessionOptions {
  initialSessionId?: string;
  initialRegion?: string;
  onSessionCreated?: (sessionId: string, region: string) => void;
}

export function useLivenessSession({
  initialSessionId,
  initialRegion,
  onSessionCreated,
}: UseLivenessSessionOptions) {
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId ?? undefined,
  );
  const [livenessRegion, setLivenessRegion] = useState<string | undefined>(
    initialRegion ?? undefined,
  );
  const [livenessError, setLivenessError] = useState<string>();
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(
    null,
  );
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync with parent state when props change (e.g., when parent resets session on retry)
  useEffect(() => {
    setSessionId(initialSessionId ?? undefined);
    setLivenessRegion(initialRegion ?? undefined);
  }, [initialSessionId, initialRegion]);

  // Get or create a liveness session from backend
  const getSessionMutation = useMutation<
    CreateLivenessCheckResponse,
    AxiosError<ApiErrorResponse>,
    void
  >({
    mutationFn: async () => {
      const res = await api.identityVerification.startLiveness();
      return res.data;
    },
    onSuccess: data => {
      setSessionId(data.sessionId ?? undefined);
      setLivenessRegion(data.region);
      if (data.attemptsRemaining !== undefined) {
        setAttemptsRemaining(data.attemptsRemaining);
      }
      if (data.sessionId) {
        onSessionCreated?.(data.sessionId, data.region);
        setIsDialogOpen(true);
      }
    },
    onError: error => {
      const errorData = error.response?.data;
      const errorClassName = errorData?.error;
      const errorMessage =
        errorData?.message || 'No se pudo iniciar la sesión de verificación';

      console.error('Failed to get/create liveness session:', {
        errorClassName,
        errorMessage,
        statusCode: errorData?.statusCode,
      });

      if (errorClassName === ErrorClassName.MaxAttemptsExceededError) {
        setMaxAttemptsReached(true);
      }

      setLivenessError(errorMessage);
    },
  });

  // Fetch AWS credentials from backend
  const {data: credentials, isLoading: credentialsLoading} = useQuery({
    queryKey: ['liveness-credentials'],
    queryFn: () =>
      api.identityVerification.getLivenessCredentials().then(res => res.data),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });

  const startVerification = useCallback(() => {
    // Always create a fresh session — reusing consumed sessions causes
    // "ReadableStream is locked" errors in the AWS Amplify SDK
    setSessionId(undefined);
    setLivenessError(undefined);
    getSessionMutation.mutate();
  }, [getSessionMutation]);

  const resetSession = useCallback(() => {
    setSessionId(undefined);
    setLivenessError(undefined);
    setMaxAttemptsReached(false);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const handleLivenessError = useCallback(
    (error: {state: string; error: Error}) => {
      console.error('[Liveness] Error:', {
        state: error.state,
        errorMessage: error.error?.message,
        errorStack: error.error?.stack,
      });
      setIsDialogOpen(false);
      setLivenessError(
        error.error?.message ||
          'Ocurrió un error durante la verificación facial',
      );
    },
    [],
  );

  const handleUserCancel = useCallback(() => {
    console.log('[Liveness] User cancelled the liveness check');
    setIsDialogOpen(false);
    setSessionId(undefined);
  }, []);

  return {
    // State
    sessionId,
    livenessRegion: livenessRegion || 'us-east-1',
    credentials,
    livenessError,
    attemptsRemaining,
    maxAttemptsReached,
    isDialogOpen,
    isLoading: getSessionMutation.isPending || credentialsLoading,

    // Actions
    startVerification,
    resetSession,
    closeDialog,
    handleLivenessError,
    handleUserCancel,
  };
}
