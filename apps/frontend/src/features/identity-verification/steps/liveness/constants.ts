// Spanish (Rioplatense) translations for the liveness detector

import { Theme } from "@aws-amplify/ui-react";

// In the future, we'll support multiple languages by switching between these constants
export const LIVENESS_DISPLAY_TEXT_ES = {
    // Hint texts
    hintCenterFaceText: 'Centrá tu cara',
    hintCenterFaceInstructionText:
        'Instrucción: Antes de comenzar, asegurate de que tu cámara esté centrada en la parte superior de la pantalla y que tu cara esté frente a la cámara. Cuando empiece la verificación, aparecerá un óvalo en el centro. Se te pedirá que te acerques al óvalo y luego que te quedes quieto. Después de unos segundos, escucharás que la verificación se completó.',
    hintFaceOffCenterText:
        'Tu cara no está en el óvalo, centrala frente a la cámara.',
    hintMoveFaceFrontOfCameraText: 'Poné tu cara frente a la cámara',
    hintTooManyFacesText:
        'Asegurate de que solo haya una cara frente a la cámara',
    hintFaceDetectedText: 'Cara detectada',
    hintCanNotIdentifyText: 'Poné tu cara frente a la cámara',
    hintTooCloseText: 'Alejate un poco',
    hintTooFarText: 'Acercate un poco',
    hintConnectingText: 'Conectando...',
    hintVerifyingText: 'Verificando...',
    hintCheckCompleteText: 'Verificación completada',
    hintIlluminationTooBrightText:
        'Hay mucha luz, buscá un lugar con menos iluminación',
    hintIlluminationTooDarkText: 'Hay poca luz, buscá un lugar más iluminado',
    hintIlluminationNormalText: 'Iluminación correcta',
    hintHoldFaceForFreshnessText: 'Mantené la posición',
    hintMatchIndicatorText: '50% completado. Seguí acercándote.',

    // Camera texts
    cameraMinSpecificationsHeadingText:
        'Tu cámara no cumple los requisitos mínimos',
    cameraMinSpecificationsMessageText:
        'La cámara debe soportar al menos una resolución de 320x240 píxeles y 15 cuadros por segundo.',
    cameraNotFoundHeadingText: 'No se puede acceder a la cámara',
    cameraNotFoundMessageText:
        'Verificá que tu dispositivo tenga cámara conectada y que hayas otorgado los permisos necesarios. Es posible que debas ir a la configuración para conceder permisos de cámara, cerrar todas las ventanas del navegador y volver a intentarlo.',
    a11yVideoLabelText: 'Cámara web para verificación de identidad',
    retryCameraPermissionsText: 'Reintentar',
    waitingCameraPermissionText: 'Esperando que autorices el acceso a la cámara.',

    // Instruction texts
    goodFitCaptionText: 'Buen encuadre',
    goodFitAltText:
        'Ilustración de una cara que encaja perfectamente dentro del óvalo.',
    tooFarCaptionText: 'Muy lejos',
    tooFarAltText:
        'Ilustración de una cara dentro de un óvalo; hay un espacio entre el contorno de la cara y los límites del óvalo.',
    photosensitivityWarningHeadingText: 'Advertencia de fotosensibilidad',
    photosensitivityWarningBodyText:
        'Esta verificación muestra luces de colores intermitentes. Procedé con precaución si sos sensible a este tipo de estímulos.',
    photosensitivityWarningInfoText:
        'Algunas personas pueden experimentar molestias o crisis epilépticas al exponerse a luces de colores. Tené precaución si vos o alguien de tu familia tiene alguna condición epiléptica.',
    photosensitivityWarningLabelText: 'Más información sobre fotosensibilidad',
    startScreenBeginCheckText: 'Comenzar verificación',

    // Deprecated texts (keeping for backwards compatibility)
    photosensitivyWarningHeadingText: 'Advertencia de fotosensibilidad',
    photosensitivyWarningBodyText:
        'Esta verificación muestra luces de colores intermitentes. Procedé con precaución si sos sensible a este tipo de estímulos.',
    photosensitivyWarningInfoText:
        'Algunas personas pueden experimentar molestias o crisis epilépticas al exponerse a luces de colores. Tené precaución si vos o alguien de tu familia tiene alguna condición epiléptica.',
    photosensitivyWarningLabelText: 'Más información sobre fotosensibilidad',

    // Stream texts
    recordingIndicatorText: 'Grabando',
    cancelLivenessCheckText: 'Cancelar verificación',

    // Error texts
    errorLabelText: 'Error',
    connectionTimeoutHeaderText: 'Se agotó el tiempo de conexión',
    connectionTimeoutMessageText:
        'La conexión ha expirado. Por favor, intentá de nuevo.',
    timeoutHeaderText: 'Se agotó el tiempo',
    timeoutMessageText:
        'Tu cara no se ubicó dentro del óvalo a tiempo. Intentá de nuevo y asegurate de llenar completamente el óvalo con tu cara.',
    faceDistanceHeaderText: 'Se detectó movimiento hacia adelante',
    faceDistanceMessageText: 'Evitá acercarte mientras se establece la conexión.',
    multipleFacesHeaderText: 'Se detectaron múltiples caras',
    multipleFacesMessageText:
        'Asegurate de que solo haya una cara frente a la cámara al momento de conectar.',
    clientHeaderText: 'Error del cliente',
    clientMessageText: 'La verificación falló debido a un problema del cliente.',
    serverHeaderText: 'Error del servidor',
    serverMessageText:
        'No se pudo completar la verificación debido a un problema del servidor.',
    landscapeHeaderText: 'Orientación horizontal no soportada',
    landscapeMessageText: 'Rotá tu dispositivo a orientación vertical (retrato).',
    portraitMessageText:
        'Asegurate de mantener tu dispositivo en orientación vertical (retrato) durante toda la verificación.',
    tryAgainText: 'Intentar de nuevo',

    // Camera error texts
    cameraAccessErrorHeaderText: 'No se pudo acceder a la cámara',
    cameraAccessErrorMessageText:
        'Asegurate de haber otorgado los permisos de cámara en tu navegador. Si ya los diste, probá cerrando otras aplicaciones que puedan estar usando la cámara.',
    cameraFramerateErrorHeaderText:
        'Tu cámara no cumple con los requisitos mínimos',
    cameraFramerateErrorMessageText:
        'Tu cámara debe ser capaz de grabar a al menos 15 cuadros por segundo para completar la verificación. Probá usando otro dispositivo o cámara.',
};

/**
* Custom theme for the Amplify Liveness component
* Uses CSS variables from the app's theme to automatically support dark/light mode
* Reference: apps/frontend/src/styles/app.css
*/
export const LIVENESS_THEME: Theme = {
    name: 'Revendiste Liveness Theme',
    tokens: {
        colors: {
            background: {
                // Main background - uses --background (white in light, dark gray in dark)
                primary: {
                    value: 'hsl(var(--background))',
                },
                // Secondary background - uses --background-secondary
                secondary: {
                    value: 'hsl(var(--background-secondary))',
                },
            },
            font: {
                // Primary text color - uses --foreground (black in light, white in dark)
                primary: {
                    value: 'hsl(var(--foreground))',
                },
                // Secondary/muted text
                secondary: {
                    value: 'hsl(var(--muted-foreground))',
                },
                // Interactive elements text
                interactive: {
                    value: 'hsl(var(--primary))',
                },
            },
            brand: {
                // Primary brand color (Jazzberry Jam - #de2486)
                // These gradient values create button states and interactive elements
                primary: {
                    '10': 'hsl(var(--primary) / 0.1)',
                    '20': 'hsl(var(--primary) / 0.2)',
                    '40': 'hsl(var(--primary) / 0.4)',
                    '60': 'hsl(var(--primary) / 0.6)',
                    '80': 'hsl(var(--primary) / 0.8)',
                    '90': 'hsl(var(--primary) / 0.9)',
                    '100': 'hsl(var(--primary))',
                },
            },
            border: {
                // Border colors
                primary: {
                    value: 'hsl(var(--border))',
                },
                secondary: {
                    value: 'hsl(var(--border))',
                },
            },
            primary: {
                '10': 'hsl(var(--primary) / 0.1)',
                '20': 'hsl(var(--primary) / 0.2)',
                '40': 'hsl(var(--primary) / 0.4)',
                '60': 'hsl(var(--primary) / 0.6)',
                '80': 'hsl(var(--primary) / 0.8)',
                '90': 'hsl(var(--primary) / 0.9)',
                '100': 'hsl(var(--primary))',
            },
        },
        components: {
            button: {
                // Primary button styles
                primary: {
                    backgroundColor: { value: 'hsl(var(--primary))' },
                    color: { value: 'hsl(var(--primary-foreground))' },
                    _hover: {
                        backgroundColor: { value: 'hsl(var(--primary) / 0.9)' },
                    },
                    _active: {
                        backgroundColor: { value: 'hsl(var(--primary) / 0.8)' },
                    },
                },
            },
            card: {
                backgroundColor: { value: 'hsl(var(--card))' },
            },
            loader: {
                strokeFilled: "#de2486",
            },
            liveness: {
                cameraModule: {
                    backgroundColor: "hsl(var(--background))",
                }
            }
        },
        radii: {
            // Match shadcn/ui border radius
            small: { value: '0.375rem' },
            medium: { value: '0.5rem' },
            large: { value: '0.75rem' },
        },
        space: {
            // Consistent spacing
            small: { value: '0.5rem' },
            medium: { value: '1rem' },
            large: { value: '1.5rem' },
        },
    },
};

/**
 * Generates CSS overrides for Amplify UI components
 * These use higher specificity selectors to override Amplify's default :root variables
 * 
 * Why this is needed:
 * - Amplify's styles.css sets default CSS variables on :root
 * - ThemeProvider sets variables on its wrapper element
 * - :root has higher specificity than element-level styles in CSS variable inheritance
 * - By injecting these overrides AFTER Amplify's base styles with higher specificity,
 *   we ensure our theme colors are actually applied
 */
export function generateThemeCssOverrides(): string {
    return `
/* Amplify Liveness Theme Overrides - Higher specificity than :root */
/* Using [data-amplify-theme] attribute selector for specificity boost */

:root,
[data-amplify-theme],
.amplify-livenesscameramodule {
    /* Background colors */
    --amplify-colors-background-primary: hsl(var(--background));
    --amplify-colors-background-secondary: hsl(var(--background-secondary, var(--muted)));
    
    /* Text colors */
    --amplify-colors-font-primary: hsl(var(--foreground));
    --amplify-colors-font-secondary: hsl(var(--muted-foreground));
    --amplify-colors-font-interactive: hsl(var(--primary));
    
    /* Border colors */
    --amplify-colors-border-primary: hsl(var(--border));
    --amplify-colors-border-secondary: hsl(var(--border));
    
    /* Brand/Primary colors */
    --amplify-colors-brand-primary-10: hsl(var(--primary) / 0.1);
    --amplify-colors-brand-primary-20: hsl(var(--primary) / 0.2);
    --amplify-colors-brand-primary-40: hsl(var(--primary) / 0.4);
    --amplify-colors-brand-primary-60: hsl(var(--primary) / 0.6);
    --amplify-colors-brand-primary-80: hsl(var(--primary) / 0.8);
    --amplify-colors-brand-primary-90: hsl(var(--primary) / 0.9);
    --amplify-colors-brand-primary-100: hsl(var(--primary));
    
    /* Primary colors (used by various Amplify components) */
    --amplify-colors-primary-10: hsl(var(--primary) / 0.1);
    --amplify-colors-primary-20: hsl(var(--primary) / 0.2);
    --amplify-colors-primary-40: hsl(var(--primary) / 0.4);
    --amplify-colors-primary-60: hsl(var(--primary) / 0.6);
    --amplify-colors-primary-80: hsl(var(--primary) / 0.8);
    --amplify-colors-primary-90: hsl(var(--primary) / 0.9);
    --amplify-colors-primary-100: hsl(var(--primary));
    
    /* Button styles */
    --amplify-components-button-primary-background-color: hsl(var(--primary));
    --amplify-components-button-primary-color: hsl(var(--primary-foreground));
    --amplify-components-button-primary-hover-background-color: hsl(var(--primary) / 0.9);
    --amplify-components-button-primary-active-background-color: hsl(var(--primary) / 0.8);
    
    /* Card styles */
    --amplify-components-card-background-color: hsl(var(--card));
    
    /* Loader styles */
    --amplify-components-loader-stroke-filled: hsl(var(--primary));
    
    /* Border radius */
    --amplify-radii-small: 0.375rem;
    --amplify-radii-medium: 0.5rem;
    --amplify-radii-large: 0.75rem;
    
    /* Spacing */
    --amplify-space-small: 0.5rem;
    --amplify-space-medium: 1rem;
    --amplify-space-large: 1.5rem;
}

/* Specific overrides for liveness camera module background */
.amplify-livenesscameramodule,
[data-amplify-theme] .amplify-livenesscameramodule {
    background-color: hsl(var(--background)) !important;
}

/* Ensure buttons use our primary color */
.amplify-button--primary,
[data-amplify-theme] .amplify-button--primary {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
}

.amplify-button--primary:hover {
    background-color: hsl(var(--primary) / 0.9) !important;
}

/* Loader/spinner color */
.amplify-loader,
[data-amplify-theme] .amplify-loader {
    --amplify-components-loader-stroke-filled: hsl(var(--primary));
}
`;
}