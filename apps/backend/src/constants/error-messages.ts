// Error messages for the orders system

import {EventTicketCurrency, formatPrice} from '@revendiste/shared';

// This will make internationalization easier in the future
export const ORDER_ERROR_MESSAGES = {
  // Event related errors
  EVENT_NOT_FOUND: 'Evento no encontrado',
  EVENT_FINISHED:
    'No se puede crear una orden para un evento que ya ha terminado',

  // Ticket wave related errors
  TICKET_WAVE_NOT_FOUND: (ticketWaveId: string) =>
    `Tanda de tickets ${ticketWaveId} no encontrada`,
  TICKET_WAVE_INVALID_EVENT: (ticketWaveId: string) =>
    `La tanda de tickets ${ticketWaveId} no pertenece al evento especificado`,

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
    `Solicitaste ${requestedQuantity}. Por favor ajusta tu selección o prueba con otro precio.`,

  // Order validation errors
  TOO_MANY_TICKETS: 'No se pueden pedir más de 10 entradas a la vez',
  NO_TICKETS_SELECTED: 'Debes seleccionar al menos una entrada',
  CANNOT_BUY_OWN_TICKETS: 'No puedes comprar tus propias entradas',
  TICKETS_NO_LONGER_AVAILABLE:
    'Las entradas seleccionadas ya no están disponibles. Por favor, actualiza tu selección e intenta nuevamente.',
  MIXED_CURRENCIES: (currencies: string) =>
    `No se pueden mezclar diferentes monedas en una misma orden. Las entradas seleccionadas tienen las siguientes monedas: ${currencies}. Por favor selecciona entradas con la misma moneda.`,

  // Validation schema errors
  INVALID_EVENT_ID: 'ID de evento inválido',
  INVALID_QUANTITY_TYPE: 'La cantidad debe ser un número',
  QUANTITY_TOO_LOW: 'La cantidad debe ser mayor o igual a 0',
  QUANTITY_TOO_HIGH: 'No se pueden pedir más de 10 entradas a la vez',

  // Order not found
  ORDER_NOT_FOUND: 'Orden no encontrada',

  // Duplicate order errors
  PENDING_ORDER_EXISTS: (orderId: string) =>
    `Ya tienes una orden pendiente para este evento. Por favor completa el pago de tu orden existente antes de crear una nueva.`,

  // Order tickets errors
  UNAUTHORIZED_TICKET_ACCESS:
    'No estás autorizado para ver los tickets de esta orden',

  // Order cancellation errors
  ORDER_NOT_CANCELLABLE:
    'Solo se pueden cancelar órdenes pendientes. Esta orden ya fue confirmada, cancelada o expiró.',
} as const;

// Error messages for ticket listings
export const TICKET_LISTING_ERROR_MESSAGES = {
  EVENT_NOT_FOUND: 'Evento no encontrado',
  EVENT_FINISHED:
    'No se puede crear una publicación para un evento que ya ha terminado',
  TICKET_WAVE_NOT_FOUND: 'Tanda de tickets no encontrada',
  TICKET_WAVE_INVALID_EVENT:
    'La tanda de tickets no pertenece al evento especificado',
  PRICE_EXCEEDS_FACE_VALUE: (faceValue: string, currency: string) =>
    `El precio no puede exceder el valor nominal de ${faceValue} ${currency}`,
  PRICE_EXCEEDS_MAX_RESALE: (
    maxResalePrice: number,
    currency: EventTicketCurrency,
  ) =>
    `El precio no puede exceder ${formatPrice(maxResalePrice, currency)} (115% del valor nominal)`,
  INVALID_QUANTITY: 'La cantidad debe ser mayor que 0',
  TICKET_NOT_FOUND: 'Ticket no encontrado',
  UNAUTHORIZED_TICKET_ACCESS: 'No estás autorizado para modificar este ticket',
  TICKET_SOLD: 'No se puede modificar un ticket que ya ha sido vendido',
  TICKET_CANCELLED: 'No se puede modificar un ticket que ha sido cancelado',
  TICKET_RESERVED:
    'No se puede modificar un ticket que está reservado en una orden',
  TICKET_DELETED: 'No se puede modificar un ticket que ha sido eliminado',
  EVENT_FINISHED_FOR_UPDATE:
    'No se puede modificar un ticket de un evento que ya ha terminado',
} as const;

// Error messages for ticket documents
export const TICKET_DOCUMENT_ERROR_MESSAGES = {
  TICKET_NOT_FOUND: 'Ticket no encontrado',
  UNAUTHORIZED_UPLOAD:
    'No estás autorizado para subir documentos para este ticket',
  UNAUTHORIZED_ACCESS: 'No estás autorizado para acceder a este ticket',
  UNAUTHORIZED_DELETE:
    'No estás autorizado para eliminar este documento de ticket',
  UNAUTHORIZED_VIEW: 'No estás autorizado para ver este ticket',
  UNSOLD_TICKET: 'No se puede subir un documento para un ticket no vendido',
  EVENT_ENDED:
    'No se puede subir un documento después de que el evento haya terminado',
  UPLOAD_TOO_EARLY: (availableAt: Date) =>
    `Aún no puedes subir el documento. Podrás hacerlo a partir del ${availableAt.toLocaleDateString(
      'es-ES',
      {day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'},
    )}`,
  DOCUMENT_NOT_FOUND: 'No se ha subido ningún documento para este ticket aún',
  DOCUMENT_NOT_FOUND_FOR_DELETE:
    'No se ha subido ningún documento para este ticket',
  TICKET_NOT_FOUND_FOR_ORDER: 'Ticket no encontrado para esta orden',
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
  ORDER_EXPIRED: 'La orden ha expirado',
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
  INSUFFICIENT_BALANCE: 'Saldo insuficiente para realizar el retiro',
  BELOW_MINIMUM_THRESHOLD: (currency: string, minimum: number) =>
    `El monto mínimo para retirar es ${minimum} ${currency}`,
  NO_EARNINGS_SELECTED: 'Debes seleccionar al menos una ganancia para retirar',
  EARNINGS_NOT_AVAILABLE: 'Las ganancias seleccionadas no están disponibles',
  MIXED_CURRENCIES:
    'No se pueden mezclar diferentes monedas en un mismo retiro',
  INVALID_PAYOUT_METHOD: 'Método de retiro inválido',
  PAYOUT_ALREADY_PROCESSED: 'Este retiro ya ha sido procesado',
  PAYOUT_NOT_PENDING: (status: string) =>
    `El retiro ya está ${status}. No se puede procesar.`,
  CURRENCY_MISMATCH_UYU_METHOD_USD_EARNINGS:
    'No puedes solicitar un retiro de ganancias en USD a una cuenta bancaria en UYU. Selecciona un método de pago en USD o PayPal.',
  CURRENCY_MISMATCH_USD_METHOD_UYU_EARNINGS:
    'No puedes solicitar un retiro de ganancias en UYU a una cuenta bancaria en USD. Selecciona un método de pago en UYU o PayPal.',
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
  TICKET_WAVE_NOT_FOUND: 'Tanda de tickets no encontrada',
  NO_FILE_UPLOADED: 'No se subió ningún archivo',
  IMAGE_UPLOAD_ERROR: 'Error al subir la imagen',
  IMAGE_NOT_FOUND: 'Imagen no encontrada',
  INVALID_IMAGE_FILE_TYPE:
    'Tipo de archivo no válido. Use JPEG, PNG, WebP o GIF.',
} as const;

// Error messages for admin identity verification
export const ADMIN_IDENTITY_VERIFICATION_ERROR_MESSAGES = {
  USER_NOT_FOUND: 'Usuario no encontrado',
  IMAGE_NOT_FOUND: 'Imagen no encontrada',
  STORAGE_SIGNED_URL_NOT_SUPPORTED:
    'El proveedor de almacenamiento no soporta URLs firmadas',
  USER_NOT_PENDING_MANUAL_REVIEW:
    'El usuario no está pendiente de revisión manual',
  VERIFICATION_APPROVED_SUCCESS: 'Verificación aprobada exitosamente',
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
    'Debes verificar tu identidad antes de publicar entradas',
  VERIFICATION_IN_REVIEW:
    'Tu verificación está siendo revisada. Te notificaremos cuando esté completa.',
  VERIFICATION_FAILED:
    'Tu verificación falló. Por favor, intenta nuevamente o contacta soporte.',
  VERIFICATION_IN_MANUAL_REVIEW:
    'Tu verificación está siendo revisada manualmente. Te notificaremos en 24-48 horas',
  VERIFICATION_SUCCESS: 'Verificación completada exitosamente',

  // Document validation errors
  DOCUMENT_ALREADY_VERIFIED:
    'Este documento ya está verificado con otra cuenta',
  DOCUMENT_COUNTRY_REQUIRED: 'El país es requerido para pasaportes',
  DOCUMENT_REQUIRED: 'Se requiere una foto del documento',
  DOCUMENT_TYPE_INVALID_OR_MISSING:
    'Tipo de documento inválido o faltante',
  DOCUMENT_TYPE_NOT_SUPPORTED: 'Tipo de documento no soportado',
  FACE_LIVENESS_NOT_CONFIGURED:
    'Face Liveness no está configurado. Contactá a soporte.',
  FACE_LIVENESS_CREDENTIALS_FAILED:
    'No se pudieron obtener credenciales para la verificación facial.',
  DOCUMENT_NUMBER_MISMATCH:
    'El documento subido no coincide con los detalles ingresados anteriormente',
  MUST_INITIATE_FIRST:
    'Debes ingresar los datos del documento antes de subir la foto',
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
    'No pudimos detectar tu cara durante la verificación. Por favor, intentá de nuevo.',
  FACE_MISMATCH:
    'No pudimos confirmar que la persona en el documento sos vos. Por favor, intentá de nuevo.',

  // Identity verification errors
  LIVENESS_CHECK_FAILED: 'La verificación no fue exitosa',
  LIVENESS_LOW_CONFIDENCE:
    'No pudimos completar la verificación. Por favor, intentá de nuevo.',
  LIVENESS_MOBILE_REQUIRED:
    'Por favor, usá un dispositivo móvil para completar la verificación',

  // Retry and attempt errors
  MAX_ATTEMPTS_EXCEEDED:
    'Llegaste al límite de intentos. Por favor, contactá a soporte',
  RETRY_AFTER_FAILURE:
    'La verificación no fue exitosa. Por favor, intentá de nuevo.',

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
    'No puedes crear un reporte para esta entidad porque no te pertenece',
  ENTITY_NOT_FOUND: 'La entidad especificada no fue encontrada',
  ALREADY_CLOSED: 'Este caso ya está cerrado',
  INVALID_ACTION_FOR_USER:
    'Esta acción solo puede ser realizada por un administrador',
  INVALID_TICKET_NO_DOCUMENT:
    'No podés reportar una entrada como inválida si aún no recibiste el documento',
  ATTACHMENT_NOT_FOUND: 'Adjunto no encontrado',
  ATTACHMENT_INVALID_TYPE: 'Tipo de archivo no permitido. Se aceptan imágenes (JPG, PNG, WEBP, HEIC) y videos (MP4, MOV, WEBM)',
  ATTACHMENT_IMAGE_TOO_LARGE: 'La imagen debe ser menor a 10 MB',
  ATTACHMENT_VIDEO_TOO_LARGE: 'El video debe ser menor a 50 MB',
  ATTACHMENT_CASE_CLOSED: 'No se pueden agregar adjuntos a un caso cerrado',
  DUPLICATE_ACTIVE_REPORT: 'Ya existe un reporte abierto para esta entidad.',
} as const;

// Type for error message keys (useful for type safety)
export type OrderErrorKey = keyof typeof ORDER_ERROR_MESSAGES;
export type NotificationErrorKey = keyof typeof NOTIFICATION_ERROR_MESSAGES;
export type PayoutErrorKey = keyof typeof PAYOUT_ERROR_MESSAGES;
export type IdentityVerificationErrorKey =
  keyof typeof IDENTITY_VERIFICATION_ERROR_MESSAGES;
export type TicketReportErrorKey = keyof typeof TICKET_REPORT_ERROR_MESSAGES;
