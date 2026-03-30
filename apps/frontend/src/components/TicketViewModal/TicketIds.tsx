import {useState} from 'react';
import {Copy, Check} from 'lucide-react';
import {copyToClipboard} from '~/utils';

interface TicketIdsProps {
  orderId?: string | null;
  ticketId: string;
}

function CopyButton({id}: {id: string}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type='button'
      onClick={handleCopy}
      className='shrink-0 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted transition-colors touch-manipulation'
      title='Copiar'
    >
      {copied ? (
        <Check className='h-3.5 w-3.5 text-green-500' />
      ) : (
        <Copy className='h-3.5 w-3.5 text-muted-foreground' />
      )}
    </button>
  );
}

function IdRow({label, id}: {label: string; id: string}) {
  const truncated =
    id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;

  return (
    <div className='flex items-center justify-between text-sm'>
      <span className='text-muted-foreground shrink-0'>{label}</span>
      <div className='flex items-center gap-1.5 min-w-0 ml-2'>
        <span className='font-mono text-muted-foreground truncate sm:hidden'>
          {truncated}
        </span>
        <span className='font-mono text-muted-foreground hidden sm:block truncate'>
          {id}
        </span>
        <CopyButton id={id} />
      </div>
    </div>
  );
}

/** Hero ticket ID + wave name — prominent, always visible for screenshots. */
export function TicketIdHero({
  ticketId,
  waveName,
}: {
  ticketId: string;
  waveName?: string | null;
}) {
  const truncated =
    ticketId.length > 16
      ? `${ticketId.slice(0, 8)}...${ticketId.slice(-4)}`
      : ticketId;

  return (
    <div className='rounded-lg border bg-muted/30 px-3 py-2 space-y-1.5'>
      <div className='flex items-center justify-between'>
        <div className='min-w-0'>
          <p className='text-xs text-muted-foreground'>ID de entrada</p>
          <p className='font-mono text-sm font-semibold truncate sm:hidden'>
            {truncated}
          </p>
          <p className='font-mono text-sm font-semibold hidden sm:block truncate'>
            {ticketId}
          </p>
        </div>
        <CopyButton id={ticketId} />
      </div>
      {waveName && (
        <div>
          <p className='text-xs text-muted-foreground'>Tipo de entrada</p>
          <p className='text-sm font-medium'>{waveName}</p>
        </div>
      )}
    </div>
  );
}

/** Compact ID rows for secondary details (order ID, etc.). */
export function TicketIds({orderId, ticketId}: TicketIdsProps) {
  return (
    <div className='space-y-1'>
      {orderId && <IdRow label='Orden:' id={orderId} />}
      <IdRow label='Entrada:' id={ticketId} />
    </div>
  );
}
