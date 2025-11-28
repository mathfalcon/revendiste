interface TicketDetailsProps {
  ticketWaveName?: string | null;
  eventStartDate?: string | null;
  price: string;
  currency?: string | null;
}

export function TicketDetails({
  ticketWaveName,
  eventStartDate,
  price,
  currency,
}: TicketDetailsProps) {
  return (
    <div className='space-y-2'>
      {ticketWaveName && (
        <div className='flex justify-between text-sm'>
          <span className='text-muted-foreground'>Categoría:</span>
          <span className='font-medium'>{ticketWaveName}</span>
        </div>
      )}
      {eventStartDate && (
        <div className='flex justify-between text-sm'>
          <span className='text-muted-foreground'>Fecha del evento:</span>
          <span className='font-medium'>
            {new Date(eventStartDate).toLocaleDateString('es-UY', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}
      <div className='flex justify-between text-sm'>
        <span className='text-muted-foreground'>Precio:</span>
        <span className='font-medium'>
          {new Intl.NumberFormat('es-UY', {
            style: 'currency',
            currency: currency || 'UYU',
          }).format(Number(price))}
        </span>
      </div>
    </div>
  );
}

