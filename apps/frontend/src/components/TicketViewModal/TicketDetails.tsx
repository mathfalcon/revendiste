interface TicketDetailsProps {
  ticketWaveName?: string | null;
  price: string;
  currency?: string | null;
}

export function TicketDetails({
  ticketWaveName,
  price,
  currency,
}: TicketDetailsProps) {
  return (
    <div className='space-y-1'>
      {ticketWaveName && (
        <div className='flex justify-between text-sm'>
          <span className='text-muted-foreground'>Categoría:</span>
          <span className='font-medium'>{ticketWaveName}</span>
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

