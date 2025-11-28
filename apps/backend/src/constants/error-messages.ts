// Error messages for the orders system
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
  ) =>
    `Solo hay ${availableCount} entradas disponibles para ${price} en ${ticketWaveName}. ` +
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
  INVALID_QUANTITY: 'La cantidad debe ser mayor que 0',
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

// Type for error message keys (useful for type safety)
export type OrderErrorKey = keyof typeof ORDER_ERROR_MESSAGES;
