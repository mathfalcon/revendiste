import {useCallback, useEffect, useState} from 'react';
import {
  FaceLivenessDetectorCore,
  type AwsCredentialProvider,
} from '@aws-amplify/ui-react-liveness';
import {Loader, ThemeProvider, type Theme} from '@aws-amplify/ui-react';
import {
  X,
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  Users,
  Server,
  Smartphone,
  Camera,
} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
// Import Amplify styles as a string for dynamic injection
import amplifyStyles from '@aws-amplify/ui-react/styles.css?inline';
import { LIVENESS_DISPLAY_TEXT_ES, LIVENESS_THEME, generateThemeCssOverrides } from './constants';

// Liveness error type based on AWS Amplify UI Liveness
interface LivenessError {
  state: string;
  error: Error;
}



/**
 * Custom Photosensitivity Warning Component
 * Styled to match the application's design system using shadcn/ui Alert
 */
function CustomPhotosensitiveWarning(): React.JSX.Element {
  return (
    <Alert className='border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20'>
      <Zap className='h-4 w-4 text-yellow-600 dark:text-yellow-500' />
      <AlertTitle className='text-yellow-800 dark:text-yellow-200'>
        {LIVENESS_DISPLAY_TEXT_ES.photosensitivityWarningHeadingText}
      </AlertTitle>
      <AlertDescription className='text-yellow-700 dark:text-yellow-300'>
        <p className='mb-2'>
          {LIVENESS_DISPLAY_TEXT_ES.photosensitivityWarningBodyText}
        </p>
        <p className='text-xs opacity-80'>
          {LIVENESS_DISPLAY_TEXT_ES.photosensitivityWarningInfoText}
        </p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Get the appropriate icon for the error type
 * Based on LivenessErrorState from @aws-amplify/ui-react-liveness
 */
function getErrorIcon(errorState: string): React.ReactNode {
  switch (errorState) {
    // Timeout errors
    case 'TIMEOUT':
    case 'CONNECTION_TIMEOUT':
    case 'FRESHNESS_TIMEOUT':
      return <Clock className='h-8 w-8 text-destructive' />;

    // Face-related errors
    case 'FACE_DISTANCE_ERROR':
    case 'MULTIPLE_FACES_ERROR':
      return <Users className='h-8 w-8 text-destructive' />;

    // Server and runtime errors
    case 'RUNTIME_ERROR':
    case 'SERVER_ERROR':
      return <Server className='h-8 w-8 text-destructive' />;

    // Device orientation error
    case 'MOBILE_LANDSCAPE_ERROR':
      return <Smartphone className='h-8 w-8 text-destructive' />;

    // Camera-related errors
    case 'CAMERA_ACCESS_ERROR':
    case 'CAMERA_FRAMERATE_ERROR':
      return <Camera className='h-8 w-8 text-destructive' />;

    default:
      return <AlertTriangle className='h-8 w-8 text-destructive' />;
  }
}

/**
 * Get error title and message in Spanish based on error state
 * Based on LivenessErrorState from @aws-amplify/ui-react-liveness
 */
function getErrorContent(errorState: string): {title: string; message: string} {
  switch (errorState) {
    // User didn't complete the check in time
    case 'TIMEOUT':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.timeoutHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.timeoutMessageText,
      };

    // WebSocket connection timed out
    case 'CONNECTION_TIMEOUT':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.connectionTimeoutHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.connectionTimeoutMessageText,
      };

    // User moved face too close before check started
    case 'FACE_DISTANCE_ERROR':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.faceDistanceHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.faceDistanceMessageText,
      };

    // Multiple faces detected in frame
    case 'MULTIPLE_FACES_ERROR':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.multipleFacesHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.multipleFacesMessageText,
      };

    // Component runtime error
    case 'RUNTIME_ERROR':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.clientHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.clientMessageText,
      };

    // Rekognition API or onAnalysisComplete error
    case 'SERVER_ERROR':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.serverHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.serverMessageText,
      };

    // User switched to landscape mode
    case 'MOBILE_LANDSCAPE_ERROR':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.landscapeHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.landscapeMessageText,
      };

    // Color flash freshness check timed out
    case 'FRESHNESS_TIMEOUT':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.timeoutHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.timeoutMessageText,
      };

    // Camera permissions denied or camera not available
    case 'CAMERA_ACCESS_ERROR':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.cameraAccessErrorHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.cameraAccessErrorMessageText,
      };

    // Camera doesn't meet minimum framerate requirements
    case 'CAMERA_FRAMERATE_ERROR':
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.cameraFramerateErrorHeaderText,
        message: LIVENESS_DISPLAY_TEXT_ES.cameraFramerateErrorMessageText,
      };

    default:
      return {
        title: LIVENESS_DISPLAY_TEXT_ES.errorLabelText,
        message:
          'Ocurrió un error durante la verificación. Por favor, intentá de nuevo.',
      };
  }
}

interface CustomErrorViewProps {
  children?: React.ReactNode;
  error?: LivenessError;
  onRetry?: () => void;
}

/**
 * Custom Error View Component
 * Styled to match the application's design system using shadcn/ui Card
 */
function CustomErrorView({
  error,
  onRetry,
}: CustomErrorViewProps): React.JSX.Element {
  const errorState = error?.state || 'RUNTIME_ERROR';
  const {title, message} = getErrorContent(errorState);

  return (
    <div className='flex items-center justify-center w-full h-full p-4 bg-background'>
      <Card className='w-full max-w-md border-destructive/30'>
        <CardHeader className='text-center pb-2'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
            {getErrorIcon(errorState)}
          </div>
          <CardTitle className='text-destructive'>{title}</CardTitle>
          <CardDescription className='text-base'>{message}</CardDescription>
        </CardHeader>
        <CardContent className='text-center space-y-4'>
          {error?.error?.message && (
            <p className='text-xs text-muted-foreground bg-muted p-2 rounded-md font-mono'>
              {error.error.message}
            </p>
          )}
          {onRetry && (
            <Button onClick={onRetry} className='w-full'>
              <RefreshCw className='mr-2 h-4 w-4' />
              {LIVENESS_DISPLAY_TEXT_ES.tryAgainText}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface LivenessCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

interface LivenessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | undefined;
  region: string;
  credentials: LivenessCredentials | undefined;
  onAnalysisComplete: () => Promise<void>;
  onError: (error: {state: string; error: Error}) => void;
  onUserCancel: () => void;
  isVerifying: boolean;
}

// Unique IDs for style elements to avoid duplicates
const AMPLIFY_STYLE_ID = 'amplify-liveness-styles';
const AMPLIFY_THEME_OVERRIDE_ID = 'amplify-liveness-theme-overrides';

export function LivenessDialog({
  isOpen,
  onClose,
  sessionId,
  region,
  credentials,
  onAnalysisComplete,
  onError,
  onUserCancel,
  isVerifying,
}: LivenessDialogProps) {
  // Track current error for custom error display
  const [currentError, setCurrentError] = useState<LivenessError | undefined>(
    undefined,
  );

  // Handle errors and propagate to parent
  const handleError = useCallback(
    (error: {state: string; error: Error}) => {
      setCurrentError(error as LivenessError);
      onError(error);
    },
    [onError],
  );

  // Handle retry by clearing error and closing dialog
  const handleRetry = useCallback(() => {
    setCurrentError(undefined);
    onClose();
  }, [onClose]);

  // Reset error when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentError(undefined);
    }
  }, [isOpen]);

  // Dynamically inject/remove Amplify styles only when dialog is open
  // This prevents style leakage to the rest of the app
  useEffect(() => {
    if (isOpen) {
      // 1. Inject base Amplify styles first
      let baseStyleElement = document.getElementById(AMPLIFY_STYLE_ID);
      if (!baseStyleElement) {
        baseStyleElement = document.createElement('style');
        baseStyleElement.id = AMPLIFY_STYLE_ID;
        baseStyleElement.textContent = amplifyStyles;
        document.head.appendChild(baseStyleElement);
      }

      // 2. Inject theme overrides AFTER base styles (higher specificity)
      // This ensures our theme CSS variables override Amplify's defaults
      let themeStyleElement = document.getElementById(AMPLIFY_THEME_OVERRIDE_ID);
      if (!themeStyleElement) {
        themeStyleElement = document.createElement('style');
        themeStyleElement.id = AMPLIFY_THEME_OVERRIDE_ID;
        themeStyleElement.textContent = generateThemeCssOverrides();
        document.head.appendChild(themeStyleElement);
      }
    }

    return () => {
      // Remove both style elements when dialog closes
      const baseStyleElement = document.getElementById(AMPLIFY_STYLE_ID);
      if (baseStyleElement) {
        baseStyleElement.remove();
      }
      const themeStyleElement = document.getElementById(AMPLIFY_THEME_OVERRIDE_ID);
      if (themeStyleElement) {
        themeStyleElement.remove();
      }
    };
  }, [isOpen]);

  // Credential provider for FaceLivenessDetectorCore
  const credentialProvider: AwsCredentialProvider = useCallback(async () => {
    if (!credentials) {
      throw new Error('Credentials not loaded');
    }
    return {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    };
  }, [credentials]);

  const handleDialogClose = useCallback(() => {
    // Don't allow closing during verification
    if (isVerifying) return;
    onClose();
  }, [isVerifying, onClose]);

  // Dialog content class - fullscreen on mobile, large on desktop
  // The dialog needs to be big enough so the colored lights illuminate the user's face
  // Using Tailwind responsive classes: mobile-first, then md: for desktop
  const dialogContentClass =
    'h-[100dvh] w-screen max-w-none rounded-none p-0 border-0 md:h-[85vh] md:w-[50vw] md:min-w-[600px] md:max-w-[50vw] md:rounded-lg md:border';

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent
        className={`${dialogContentClass} flex flex-col`}
        showCloseButton={false}
      >
        {/* Header - hidden on mobile for more space, shown on desktop */}
        <DialogHeader className='hidden md:block px-6 pt-6 pb-2 shrink-0'>
          <DialogTitle>Verificación de identidad</DialogTitle>
          <DialogDescription>
            Seguí las instrucciones en pantalla
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 min-h-0 md:px-4 md:pb-4'>
          {sessionId && credentials ? (
            <ThemeProvider theme={LIVENESS_THEME}>
              <FaceLivenessDetectorCore
                sessionId={sessionId}
                region={region}
                onAnalysisComplete={onAnalysisComplete}
                onError={handleError}
                onUserCancel={onUserCancel}
                disableStartScreen={true}
                config={{credentialProvider}}
                displayText={LIVENESS_DISPLAY_TEXT_ES}
                components={{
                  PhotosensitiveWarning: CustomPhotosensitiveWarning,
                  ErrorView: () => (
                    <CustomErrorView
                      error={currentError}
                      onRetry={handleRetry}
                    />
                  ),
                }}
              />
            </ThemeProvider>
          ) : (
            <div className='flex flex-col items-center justify-center h-full gap-4'>
              <Loader size='large' />
              <p className='text-sm text-muted-foreground'>
                Cargando verificación...
              </p>
            </div>
          )}
        </div>

        {/* Close button - positioned absolutely */}
        <Button
          variant='ghost'
          size='icon'
          className='absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background'
          onClick={onClose}
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Cerrar</span>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
