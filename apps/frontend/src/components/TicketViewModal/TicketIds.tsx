import {useState} from 'react';
import {Copy, Check} from 'lucide-react';
import {copyToClipboard} from '~/utils';

interface TicketIdsProps {
  orderId?: string | null;
  ticketId: string;
}

function IdRow({label, id}: {label: string; id: string}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <button
          type='button'
          onClick={handleCopy}
          className='shrink-0 inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted transition-colors'
          title='Copiar'
        >
          {copied ? (
            <Check className='h-3 w-3 text-green-500' />
          ) : (
            <Copy className='h-3 w-3 text-muted-foreground' />
          )}
        </button>
      </div>
    </div>
  );
}

export function TicketIds({orderId, ticketId}: TicketIdsProps) {
  return (
    <div className='space-y-1'>
      {orderId && <IdRow label='Orden:' id={orderId} />}
      <IdRow label='Ticket:' id={ticketId} />
    </div>
  );
}
