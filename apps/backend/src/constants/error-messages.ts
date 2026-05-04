// Error messages for the orders system

import {EventTicketCurrency, formatPrice} from '@revendiste/shared';

// This will make internationalization easier in the future
export const ORDER_ERROR_MESSAGES = {
  // Event related errors
  EVENT_NOT_FOUND: 'Evento no encontrado',
  EVENT_FINISHED: 'No podés crear una orden para un evento que ya terminó',

  // Ticket wave related errors
  TICKET_WAVE_NOT_FOUND: (ticketWaveId: string) =>
    `Tanda de entradas ${ticketWaveId} no encontrada`,
  TICKET_WAVE_INVALID_EVENT: (ticketWaveId: string) =>
    `La tanda de entradas ${ticketWaveId} no pertenece al evento especificado`,

  // Ticket availability errors
  INSUFFICIENT_TICKETS: (
    availableCount: number,
    price: number,
    ticketWaveName: string,
    requestedQuantity: number,
    currency: EventTicketCurrency,
  ) =>
    `Solo hay ${availableCount} entradas disponibles a ${formatPrice(
      price,
      currency,
    )} en ${ticketWaveName}. ` +
    `Pediste ${requestedQuantity}. Ajustá tu selección o probá con otro precio.`,

  // Order validation errors
  TOO_MANY_TICKETS: 'No podés pedir más de 10 entradas a la vez',
  NO_TICKETS_SELECTED: 'Tenés que seleccionar al menos una entrada',
  CANNOT_BUY_OWN_TICKETS: 'No podés comprar tus propias entradas',
  TICKETS_NO_LONGER_AVAILABLE:
    'Las entradas seleccionadas ya no están disponibles. Actualizá tu selección e intentá de nuevo.',
  MIXED_CURRENCIES: (currencies: string) =>
    `No podés mezclar diferentes monedas en una misma orden. Las entradas seleccionadas tienen las siguientes monedas: ${currencies}. Seleccioná entradas con la misma moneda.`,

  // Validation schema errors
  INVALID_EVENT_ID: 'ID de evento inválido',
  INVALID_QUANTITY_TYPE: 'La cantidad debe ser un número',
  QUANTITY_TOO_LOW: 'La cantidad debe ser mayor o igual a 0',
  QUANTITY_TOO_HIGH: 'No podés pedir más de 10 entradas a la vez',

  // Order not found
  ORDER_NOT_FOUND: 'Orden no encontrada',

  // Duplicate order errors
  PENDING_ORDER_EXISTS: (orderId: string) =>
    `Ya tenés una orden pendiente para este evento. Completá el pago de tu orden existente antes de crear una nueva.`,

  // Order tickets errors
  UNAUTHORIZED_TICKET_ACCESS:
    'No estás autorizado para ver las entradas de esta orden',

  // Order cancellation errors
  ORDER_NOT_CANCELLABLE:
    'Solo se pueden cancelar órdenes pendientes. Esta orden ya fue confirmada, cancelada o expiró.',
} as const;

// Error messages for ticket listings
export const TICKET_LISTING_ERROR_MESSAGES = {
  EVENT_NOT_FOUND: 'Evento no encontrado',
  EVENT_FINISHED: 'No podés publicar entradas de un evento que ya terminó',
  TICKET_WAVE_NOT_FOUND: 'Tanda de entradas no encontrada',
  TICKET_WAVE_INVALID_EVENT:
    'La tanda de entradas no pertenece al evento especificado',
  PRICE_EXCEEDS_FACE_VALUE: (faceValue: string, currency: string) =>
    `El precio no puede exceder el valor nominal de ${faceValue} ${currency}`,
  PRICE_EXCEEDS_MAX_RESALE: (
    maxResalePrice: number,
    currency: EventTicketCurrency,
  ) =>
    `El precio no puede exceder ${formatPrice(
      maxResalePrice,
      currency,
    )} (115% del valor nominal)`,
  INVALID_QUANTITY: 'La cantidad debe ser mayor que 0',
  LISTING_NOT_FOUND: 'No encontramos esa publicación en tu cuenta.',
  TICKET_NOT_FOUND: 'Entrada no encontrada',
  UNAUTHORIZED_TICKET_ACCESS: 'No estás autorizado para modificar esta entrada',
  TICKET_SOLD: 'No podés modificar una entrada que ya se vendió',
  TICKET_CANCELLED: 'No podés modificar una entrada que fue cancelada',
  TICKET_RESERVED:
    'No podés modificar una entrada que está reservada en una orden',
  TICKET_DELETED: 'No podés modificar una entrada que fue eliminada',
  EVENT_FINISHED_FOR_UPDATE:
    'No podés modificar una entrada de un evento que ya terminó',
  TICKET_LIMIT_REACHED:
    'Ya tenés 5 entradas publicadas para este evento. Eliminá alguna para poder publicar más.',
  TICKET_LIMIT_EXCEEDED: (remaining: number) =>
    `No podés publicar más de 5 entradas por evento. Te quedan ${remaining} entrada${remaining === 1 ? '' : 's'} disponible${remaining === 1 ? '' : 's'}.`,
  DOCUMENTS_REQUIRED_IN_UPLOAD_WINDOW:
    'El evento está dentro de la ventana de subida. Tenés que adjuntar los documentos de las entradas.',
  DOCUMENTS_COUNT_MISMATCH: (expected: number, received: number) =>
    `Tenés que subir ${expected} documento${expected === 1 ? '' : 's'}, pero se recibieron ${received}.`,
} as const;

// Error messages for ticket documents
export const TICKET_DOCUMENT_ERROR_MESSAGES = {
  TICKET_NOT_FOUND: 'Entrada no encontrada',
  UNAUTHORIZED_UPLOAD:
    'No estás autorizado para subir documentos para esta entrada',
  UNAUTHORIZED_ACCESS: 'No estás autorizado para acceder a esta entrada',
  UNAUTHORIZED_DELETE: 'No estás autorizado para eliminar este documento',
  UNAUTHORIZED_VIEW: 'No estás autorizado para ver esta entrada',
  UNSOLD_TICKET: 'No podés subir un documento para una entrada no vendida',
  EVENT_ENDED: 'No podés subir un documento después de que terminó el evento',
  UPLOAD_TOO_EARLY: (availableAt: Date) =>
    `Todavía no podés subir el documento. Vas a poder hacerlo a partir del ${availableAt.toLocaleDateString(
      'es-ES',
      {day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'},
    )}`,
  DOCUMENT_NOT_FOUND: 'Todavía no se subió ningún documento para esta entrada',
  DOCUMENT_NOT_FOUND_FOR_DELETE:
    'No se subió ningún documento para esta entrada',
  TICKET_NOT_FOUND_FOR_ORDER: 'Entrada no encontrada para esta orden',
  FILE_SIZE_EXCEEDED: (maxSizeMB: number) =>
    `El tamaño del archivo excede el tamaño máximo permitido de ${maxSizeMB}MB`,
  INVALID_FILE_TYPE: (mimeType: string, allowedTypes: string[]) =>
    `El tipo de archivo ${mimeType} no está permitido. Tipos permitidos: ${allowedTypes.join(
      ', ',
    )}`,
} as const;

// Error messages for payments
export const PAYMENT_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: 'Orden no encontrada',
  ORDER_EXPIRED: 'La orden expiró',
  ORDER_NOT_PENDING: (status: string) =>
    `La orden ya está ${status}. No se puede crear un enlace de pago.`,
  PAYMENT_NOT_FOUND: 'Registro de pago no encontrado',
  PAYMENT_AMOUNT_MISMATCH:
    'El monto del pago no coincide con el total de la orden',
  PAYMENT_CREATION_FAILED: (error: string) =>
    `Error al crear el enlace de pago: ${error}`,
} as const;

// Error messages for notifications
export const NOTIFICATION_ERROR_MESSAGES = {
  NOTIFICATION_NOT_FOUND: 'Notificación no encontrada',
  UNAUTHORIZED_ACCESS: 'No estás autorizado para acceder a esta notificación',
  INVALID_CHANNELS: 'Los canales de notificación especificados no son válidos',
  USER_NOT_FOUND: 'Usuario no encontrado',
  EMAIL_SEND_FAILED: (error: string) =>
    `Error al enviar el correo electrónico: ${error}`,
} as const;

// Error messages for payouts
export const PAYOUT_ERROR_MESSAGES = {
  PAYOUT_NOT_FOUND: 'Retiro no encontrado',
  PAYOUT_METHOD_NOT_FOUND: 'Método de retiro no encontrado',
  UNAUTHORIZED_ACCESS: 'No estás autorizado para acceder a este retiro',
  INSUFFICIENT_BALANCE: 'No tenés saldo suficiente para este retiro',
  BELOW_MINIMUM_THRESHOLD: (currency: string, minimum: number) =>
    `El monto mínimo para retirar es ${minimum} ${currency}`,
  NO_EARNINGS_SELECTED:
    'Tenés que seleccionar al menos una ganancia para retirar',
  EARNINGS_NOT_AVAILABLE: 'Las ganancias seleccionadas no están disponibles',
  MIXED_CURRENCIES: 'No podés mezclar diferentes monedas en un mismo retiro',
  INVALID_PAYOUT_METHOD: 'Método de retiro inválido',
  PAYOUT_ALREADY_PROCESSED: 'Este retiro ya fue procesado',
  PAYOUT_NOT_PENDING: (status: string) =>
    `El retiro ya está ${status}. No se puede procesar.`,
  CURRENCY_MISMATCH_UYU_METHOD_USD_EARNINGS:
    'No podés retirar ganancias en USD a una cuenta bancaria en UYU. Seleccioná un método de retiro en USD.',
  CURRENCY_MISMATCH_USD_METHOD_UYU_EARNINGS:
    'No podés retirar ganancias en UYU a una cuenta bancaria en USD. Seleccioná un método de retiro en UYU.',
  EARNINGS_WITH_OPEN_REPORTS:
    'Algunas ganancias seleccionadas tienen reportes abiertos y no pueden ser retiradas. Esperá a que se resuelvan los reportes.',
  EARNINGS_SELECTION_CHANGED:
    'Las ganancias seleccionadas ya no están disponibles. Actualizá el resumen e intentá de nuevo.',
  USD_UYU_EXCHANGE_RATE_UNAVAILABLE:
    'No pudimos obtener la cotización del dólar (BROU ni Itaú). Probá de nuevo en unos minutos.',
  PAYOUT_PROVIDER_NOT_REGISTERED: (provider: string) =>
    `Proveedor de retiro no registrado: ${provider}. Contactá a soporte.`,
  DLOCAL_GO_PAYOUTS_DISABLED:
    'El retiro a bancos argentinos aún no está activo para tu cuenta. Probá de nuevo más tarde.',
  ARGENTINIAN_PAYOUT_REQUIRES_USD_EARNINGS:
    'Solo podés vincular un método argentino cuando tenés saldo a cobrar en dólares (USD).',
  DLOCAL_PAYOUT_QUOTE_FAILED:
    'No pudimos obtener la cotización para el retiro en ARS. Probá de nuevo en unos minutos o elegí cobrar en USD al mismo método.',
  DLOCAL_PAYOUT_REMITTER_NOT_CONFIGURED:
    'Falta la configuración del emisor dLocal (remitente) en el servidor. Contactá a soporte.',
} as const;

// Error messages for processor settlements (reconciliation)
export const SETTLEMENT_ERROR_MESSAGES = {
  SETTLEMENT_NOT_FOUND: 'Liquidación no encontrada.',
  SETTLEMENT_ITEM_NOT_FOUND: 'No se encontró el ítem de liquidación indicado.',
  INVALID_TOTAL_AMOUNT: 'El monto total de la liquidación no es válido.',
  SETTLEMENT_ALREADY_EXISTS:
    'Ya existe una liquidación con este ID externo para el mismo procesador.',
  NO_UNRECONCILED_PAYMENTS:
    'No hay pagos del procesador sin conciliar para la moneda y fecha indicadas.',
  INSUFFICIENT_PAYMENTS_FOR_AMOUNT:
    'No alcanzan los pagos acumulados para cubrir el monto declarado de la liquidación.',
  AMOUNT_MISMATCH_TOO_HIGH: (pct: string) =>
    `La suma de créditos del procesador (${pct}% de diferencia) no coincide con el monto declarado. Revisá el monto o los pagos incluidos.`,
  INVALID_METADATA:
    'Los metadatos enviados para la liquidación no son válidos. Revisá el cuerpo de la solicitud.',
} as const;

// Error messages for webhook signature verification (Clerk, dLocal, etc.)
export const WEBHOOK_ERROR_MESSAGES = {
  VERIFICATION_FAILED: 'Webhook verification failed',
} as const;

// Error messages for events (used when repository returns null)
export const EVENT_ERROR_MESSAGES = {
  EVENT_NOT_FOUND: 'Evento no encontrado',
} as const;

// Error messages for admin events
export const ADMIN_EVENTS_ERROR_MESSAGES = {
  TICKET_WAVE_NOT_FOUND: 'Tanda de entradas no encontrada',
  NO_FILE_UPLOADED: 'No se subió ningún archivo',
  IMAGE_UPLOAD_ERROR: 'Error al subir la imagen',
  IMAGE_NOT_FOUND: 'Imagen no encontrada',
  INVALID_IMAGE_FILE_TYPE:
    'Tipo de archivo no válido. Usá JPEG, PNG, WebP o GIF.',
  EVENT_CREATION_FAILED: 'Error al crear el evento',
  VENUE_CREATION_FAILED: 'Error al crear el lugar',
  EXTERNAL_ID_DUPLICATE: 'Ya existe un evento con este ID externo',
} as const;

// Error messages for admin identity verification
export const ADMIN_IDENTITY_VERIFICATION_ERROR_MESSAGES = {
  USER_NOT_FOUND: 'Usuario no encontrado',
  IMAGE_NOT_FOUND: 'Imagen no encontrada',
  STORAGE_SIGNED_URL_NOT_SUPPORTED:
    'El proveedor de almacenamiento no soporta URLs firmadas',
  USER_NOT_PENDING_MANUAL_REVIEW:
    'El usuario no está pendiente de revisión manual',
  VERIFICATION_APPROVED_SUCCESS: 'Verificación aprobada',
  VERIFICATION_REJECTED: 'Verificación rechazada',
} as const;

// Error messages for payout documents
export const PAYOUT_DOCUMENT_ERROR_MESSAGES = {
  DOCUMENT_CREATE_FAILED: 'Error al crear el registro del documento',
  DOCUMENT_NOT_FOUND: 'Documento no encontrado',
  DOCUMENT_DELETE_FAILED: 'Error al eliminar el documento',
} as const;

// Error messages for admin operations
export const ADMIN_ERROR_MESSAGES = {
  ADMIN_ONLY: 'Solo los administradores pueden acceder a esta funcionalidad',
  INVALID_ROLE: 'Rol de usuario inválido',
} as const;

// Error messages for identity verification
export const IDENTITY_VERIFICATION_ERROR_MESSAGES = {
  // General verification errors
  VERIFICATION_REQUIRED:
    'Tenés que verificar tu identidad antes de publicar entradas',
  VERIFICATION_IN_REVIEW:
    'Tu verificación está siendo revisada. Te avisamos cuando esté lista.',
  VERIFICATION_FAILED:
    'Tu verificación falló. Intentá de nuevo o contactá a soporte.',
  VERIFICATION_IN_MANUAL_REVIEW:
    'Tu verificación está siendo revisada manualmente. Te avisamos en 24-48 horas.',
  VERIFICATION_SUCCESS: 'Verificación completada',

  // Document validation errors
  DOCUMENT_ALREADY_VERIFIED:
    'Este documento ya está verificado con otra cuenta',
  DOCUMENT_COUNTRY_REQUIRED: 'El país es requerido para pasaportes',
  DOCUMENT_REQUIRED: 'Necesitamos una foto del documento',
  DOCUMENT_TYPE_INVALID_OR_MISSING: 'Tipo de documento inválido o faltante',
  DOCUMENT_TYPE_NOT_SUPPORTED: 'Tipo de documento no soportado',
  FACE_LIVENESS_NOT_CONFIGURED:
    'Face Liveness no está configurado. Contactá a soporte.',
  FACE_LIVENESS_CREDENTIALS_FAILED:
    'No se pudieron obtener credenciales para la verificación facial.',
  DOCUMENT_NUMBER_MISMATCH:
    'El documento subido no coincide con los detalles ingresados anteriormente',
  MUST_INITIATE_FIRST:
    'Tenés que ingresar los datos del documento antes de subir la foto',
  DOCUMENT_VERIFICATION_REQUIRED:
    'Tenés que completar la verificación del documento antes de continuar',

  // CI Uruguay validation errors
  CI_INVALID: 'El número de CI no es válido',
  CI_INVALID_DETECTED: 'El número de CI detectado no es válido',
  CI_NOT_DETECTED: 'No se pudo detectar un número de CI válido en el documento',

  // DNI Argentina validation errors
  DNI_INVALID_FORMAT: 'El número de DNI debe tener 7 u 8 dígitos',
  DNI_NOT_DETECTED:
    'No se pudo detectar un número de DNI válido en el documento',

  // Passport validation errors
  PASSPORT_NOT_DETECTED: 'No se pudo detectar un número de pasaporte válido',

  // Face detection and comparison errors
  FACE_NOT_DETECTED_IN_DOCUMENT:
    'No se detectó una cara válida en el documento',
  FACE_NOT_DETECTED_IN_LIVENESS:
    'No pudimos detectar tu cara durante la verificación. Intentá de nuevo.',
  FACE_MISMATCH:
    'No pudimos confirmar que la persona en el documento sos vos. Intentá de nuevo.',

  // Identity verification errors
  LIVENESS_CHECK_FAILED: 'La verificación falló',
  LIVENESS_LOW_CONFIDENCE:
    'No pudimos completar la verificación. Intentá de nuevo.',
  LIVENESS_MOBILE_REQUIRED:
    'Por favor, usá un dispositivo móvil para completar la verificación',

  // Retry and attempt errors
  MAX_ATTEMPTS_EXCEEDED:
    'Llegaste al límite de intentos. Por favor, contactá a soporte',
  RETRY_AFTER_FAILURE: 'La verificación falló. Intentá de nuevo.',

  // Manual review reasons (for internal use)
  MANUAL_REVIEW_FACE_SIMILARITY: (similarity: number) =>
    `Face similarity score: ${similarity}% (threshold: 90%)`,
  MANUAL_REVIEW_LOW_CONFIDENCE: (confidenceType: string, confidence: number) =>
    `Low ${confidenceType} confidence: ${confidence}%`,
  MANUAL_REVIEW_POOR_IMAGE_QUALITY: 'Poor document image quality',
  MANUAL_REVIEW_MULTIPLE_ATTEMPTS: 'Multiple failed verification attempts',
} as const;

// Error messages for FEU invoicing and jobs
export const INVOICE_ERROR_MESSAGES = {
  FEU_AUTH_FAILED:
    'Error de autenticación con el servicio de facturación electrónica',
  FEU_CREATE_FAILED: 'Error al crear el comprobante fiscal electrónico',
  FEU_PDF_DOWNLOAD_FAILED: 'Error al descargar el PDF de la factura',
  INVOICE_ALREADY_EXISTS: (orderId: string, party: string) =>
    `Ya existe una factura para la orden ${orderId} y parte ${party}`,
} as const;

// Error messages for the ticket report / case system
export const TICKET_REPORT_ERROR_MESSAGES = {
  REPORT_NOT_FOUND: 'Reporte no encontrado',
  UNAUTHORIZED_ACCESS: 'No estás autorizado para acceder a este reporte',
  UNAUTHORIZED_ENTITY_ACCESS:
    'No podés crear un reporte para esta entidad porque no te pertenece',
  ENTITY_NOT_FOUND: 'La entidad especificada no fue encontrada',
  ALREADY_CLOSED: 'Este caso ya está cerrado',
  INVALID_ACTION_FOR_USER:
    'Esta acción solo puede ser realizada por un administrador',
  INVALID_TICKET_NO_DOCUMENT:
    'No podés reportar una entrada como inválida si aún no recibiste el documento',
  ATTACHMENT_NOT_FOUND: 'Adjunto no encontrado',
  ATTACHMENT_INVALID_TYPE:
    'Tipo de archivo no permitido. Se aceptan imágenes (JPG, PNG, WEBP, HEIC) y videos (MP4, MOV, WEBM)',
  ATTACHMENT_IMAGE_TOO_LARGE: 'La imagen debe ser menor a 10 MB',
  ATTACHMENT_VIDEO_TOO_LARGE: 'El video debe ser menor a 50 MB',
  ATTACHMENT_CASE_CLOSED: 'No se pueden agregar adjuntos a un caso cerrado',
  DUPLICATE_ACTIVE_REPORT: 'Ya existe un reporte abierto para esta entidad.',
  ENTITY_ALREADY_RESOLVED:
    'Este ticket ya fue revisado y resuelto por nuestro equipo de soporte. No se pueden crear más reportes.',
} as const;

// Error messages for profile management
export const PROFILE_ERROR_MESSAGES = {
  // Profile update errors
  FIRST_NAME_REQUIRED: 'El nombre es requerido',
  LAST_NAME_REQUIRED: 'El apellido es requerido',

  // Profile image errors
  IMAGE_REQUIRED: 'Se requiere una imagen',
  IMAGE_UPLOAD_FAILED: (error: string) =>
    `Error al subir la imagen de perfil: ${error}`,
  IMAGE_DELETE_FAILED: (error: string) =>
    `Error al eliminar la imagen de perfil: ${error}`,

  // Email errors
  EMAIL_NOT_FOUND: 'Dirección de email no encontrada',
  EMAIL_NOT_OWNED: 'No estás autorizado para modificar este email',
  EMAIL_IS_PRIMARY: 'No se puede eliminar el email principal',
  EMAIL_ADDRESS_ID_REQUIRED: 'El ID del email es requerido',
  EMAIL_ADDRESS_REQUIRED: 'La dirección de email es requerida',
  EMAIL_ADD_FAILED: (error: string) => `Error al agregar el email: ${error}`,
  EMAIL_VERIFICATION_CODE_REQUIRED: 'El código de verificación es requerido',
  EMAIL_VERIFICATION_FAILED: (error: string) =>
    `Error al verificar el email: ${error}`,

  // Password errors
  PASSWORD_REQUIRED: 'La contraseña es requerida',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  CURRENT_PASSWORD_REQUIRED: 'La contraseña actual es requerida',
  CURRENT_PASSWORD_INCORRECT: 'La contraseña actual es incorrecta',
  ALREADY_HAS_PASSWORD:
    'Ya tenés una contraseña configurada. Usá la opción de cambiar contraseña.',
  NO_PASSWORD_SET:
    'No tenés una contraseña configurada. Usá la opción de crear contraseña.',
  PASSWORD_SET_FAILED: (error: string) =>
    `Error al configurar la contraseña: ${error}`,

  // Session errors
  SESSION_NOT_FOUND: 'Sesión no encontrada',
  SESSION_NOT_OWNED: 'No estás autorizado para revocar esta sesión',
  SESSION_REVOKE_FAILED: (error: string) =>
    `Error al revocar la sesión: ${error}`,

  // Account deletion errors
  DELETE_CONFIRMATION_REQUIRED:
    'Tenés que escribir "ELIMINAR" para confirmar la eliminación de tu cuenta',
  DELETE_CONFIRMATION_INVALID:
    'La confirmación no es correcta. Escribí "ELIMINAR" para confirmar.',
  ACCOUNT_DELETE_FAILED: (error: string) =>
    `Error al eliminar la cuenta: ${error}`,
} as const;

export const OTP_ERROR_MESSAGES = {
  RATE_LIMITED:
    'Demasiados intentos. Esperá unos minutos antes de pedir otro código.',
  EXPIRED: 'El código expiró o no existe. Pedí uno nuevo.',
  INVALID: 'El código ingresado es incorrecto.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos fallidos. Pedí un nuevo código.',
  SEND_FAILED: (error: string) =>
    `Error al enviar el código de verificación: ${error}`,
} as const;

// Validation error messages for forms
export const VALIDATION_MESSAGES = {
  // Generic validation
  NO_FILE_UPLOADED: 'No se subió ningún archivo',
  QUANTITY_MUST_BE_POSITIVE: 'La cantidad debe ser mayor que 0',

  // Admin identity verification
  REJECTION_REASON_REQUIRED: 'Debe proporcionar un motivo de rechazo',

  // Admin payouts
  FAILURE_REASON_REQUIRED: 'Debe proporcionar una razón para el fallo',
  CANCELLATION_REASON_REQUIRED:
    'Debe proporcionar una razón para la cancelación',

  // Admin events
  NAME_REQUIRED: 'El nombre es requerido',
  PRICE_MUST_BE_POSITIVE: 'El valor debe ser positivo',
  URL_INVALID: 'URL inválida',

  // Identity verification
  DOCUMENT_COUNTRY_REQUIRED_PASSPORT: 'El país es requerido para pasaportes',

  // Admin dashboard
  DASHBOARD_RANGE_INCOMPLETE:
    'Debés indicar fecha de inicio y fin para el rango personalizado',
  DASHBOARD_RANGE_INVALID_ORDER:
    'La fecha de inicio debe ser anterior o igual a la fecha de fin',

  // Ticket reports
  ACTION_INVALID: 'Acción inválida',
  ACTION_TYPE_INVALID: 'Tipo de acción inválido',
  ENTITY_ID_INVALID: 'ID de entidad inválido',
  ID_REQUIRED: 'El identificador es requerido',
} as const;

// Button labels for notifications (for future i18n)
export const NOTIFICATION_BUTTON_LABELS = {
  UPLOAD_DOCUMENTS: 'Subir documentos',
  VIEW_MY_TICKETS: 'Ver mis tickets',
  RETRY_PAYMENT: 'Reintentar pago',
  VIEW_AND_DOWNLOAD_TICKETS: 'Ver y descargar entradas',
  VIEW_PAYOUT_DETAILS: 'Ver detalles del retiro',
  PUBLISH_TICKETS: 'Publicar entradas',
  RETRY_VERIFICATION: 'Reintentar verificación',
  VIEW_EARNINGS: 'Ver ganancias',
  REQUEST_WITHDRAWAL: 'Solicitar retiro',
  VIEW_MY_CASE: 'Ver mi caso',
} as const;

// User-facing success/info messages
export const USER_MESSAGES = {
  // Identity verification
  VERIFICATION_INITIATED: 'Verificación iniciada',
  VERIFICATION_APPROVED: 'Verificación aprobada',
  VERIFICATION_REJECTED: 'Verificación rechazada',

  // Failure reasons for user display
  LIVENESS_FAILED_USER: 'No pudimos verificar que sos una persona real',
  FACE_MISMATCH_USER:
    'La foto de tu documento no coincide con la verificación facial',
  VERIFICATION_FAILED_RETRY:
    'La verificación falló. Podés intentarlo de nuevo asegurándote de tener buena iluminación.',
} as const;

// Internal failure reasons for identity verification (not shown to users)
export const INTERNAL_VERIFICATION_REASONS = {
  LIVENESS_CHECK_FAILED: 'Liveness check failed',
  MULTIPLE_FAILED_ATTEMPTS: 'Multiple failed verification attempts',
  FACE_MISMATCH: 'Face mismatch between document and liveness check',
  LOW_TEXT_CONFIDENCE: 'Low text detection confidence',
  POOR_IMAGE_QUALITY: 'Poor document image quality',
  NO_REFERENCE_IMAGE: 'No reference image in liveness results',
  NO_FACE_MATCH: 'Face detected in liveness but no match found in document',
  NO_FACE_DETECTED: 'No face detected in one or both images',
  FACE_COMPARISON_NO_RESULT: 'Face comparison returned no result',
} as const;

// Clerk auth notification titles
export const CLERK_AUTH_NOTIFICATION_TITLES = {
  INVITATION: 'Tenés una invitación a Revendiste',
  PASSWORD_CHANGED: 'Tu contraseña de Revendiste fue cambiada',
  PASSWORD_REMOVED: 'Se eliminó la contraseña de tu cuenta en Revendiste',
  PRIMARY_EMAIL_CHANGED:
    'Se actualizó el email principal de tu cuenta en Revendiste',
  NEW_DEVICE_SIGN_IN: 'Nuevo inicio de sesión en tu cuenta de Revendiste',
} as const;

// Type for error message keys (useful for type safety)
export type OrderErrorKey = keyof typeof ORDER_ERROR_MESSAGES;
export type NotificationErrorKey = keyof typeof NOTIFICATION_ERROR_MESSAGES;
export type PayoutErrorKey = keyof typeof PAYOUT_ERROR_MESSAGES;
export type IdentityVerificationErrorKey =
  keyof typeof IDENTITY_VERIFICATION_ERROR_MESSAGES;
export type TicketReportErrorKey = keyof typeof TICKET_REPORT_ERROR_MESSAGES;
export type ValidationMessageKey = keyof typeof VALIDATION_MESSAGES;
export type NotificationButtonLabelKey =
  keyof typeof NOTIFICATION_BUTTON_LABELS;
export type UserMessageKey = keyof typeof USER_MESSAGES;
export type InternalVerificationReasonKey =
  keyof typeof INTERNAL_VERIFICATION_REASONS;
export type ClerkAuthNotificationTitleKey =
  keyof typeof CLERK_AUTH_NOTIFICATION_TITLES;
