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

  // Validation schema errors
  INVALID_EVENT_ID: 'ID de evento inválido',
  INVALID_QUANTITY_TYPE: 'La cantidad debe ser un número',
  QUANTITY_TOO_LOW: 'La cantidad debe ser mayor o igual a 0',
  QUANTITY_TOO_HIGH: 'No se pueden pedir más de 10 entradas a la vez',
} as const;

// Type for error message keys (useful for type safety)
export type OrderErrorKey = keyof typeof ORDER_ERROR_MESSAGES;
