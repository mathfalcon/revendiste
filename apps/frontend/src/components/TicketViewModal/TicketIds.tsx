interface TicketIdsProps {
  orderId?: string | null;
  ticketId: string;
}

export function TicketIds({orderId, ticketId}: TicketIdsProps) {
  return (
    <div className='space-y-1 text-xs text-muted-foreground'>
      {orderId && (
        <div className='flex justify-between'>
          <span>ID de la orden:</span>
          <span className='font-mono'>{orderId}</span>
        </div>
      )}
      <div className='flex justify-between'>
        <span>ID del ticket:</span>
        <span className='font-mono'>{ticketId}</span>
      </div>
    </div>
  );
}

