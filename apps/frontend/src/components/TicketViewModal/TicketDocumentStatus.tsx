import {FileText, AlertCircle} from 'lucide-react';
import {Alert, AlertDescription} from '~/components/ui/alert';

interface TicketDocumentStatusProps {
  hasDocument: boolean;
}

export function TicketDocumentStatus({hasDocument}: TicketDocumentStatusProps) {
  if (hasDocument) {
    return (
      <div className='flex items-center gap-2 text-green-600'>
        <FileText className='h-5 w-5' />
        <span className='font-semibold'>Ticket disponible</span>
      </div>
    );
  }

  return (
    <Alert>
      <AlertCircle className='h-4 w-4' />
      <AlertDescription>
        El vendedor aún no ha subido el ticket. Por favor, espera a que el
        vendedor complete la carga del documento.
      </AlertDescription>
    </Alert>
  );
}
