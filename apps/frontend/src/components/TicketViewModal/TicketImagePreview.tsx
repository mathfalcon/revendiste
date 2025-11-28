import {ImageWithLoading} from '~/components';
import {isImageFile, getFullFileUrl} from './utils';

interface TicketImagePreviewProps {
  url: string;
  ticketId: string;
  mimeType?: string | null;
}

export function TicketImagePreview({
  url,
  ticketId,
  mimeType,
}: TicketImagePreviewProps) {
  if (!isImageFile(mimeType)) {
    return null;
  }

  return (
    <div className='mt-4'>
      <ImageWithLoading
        src={getFullFileUrl(url)}
        alt={`Ticket ${ticketId}`}
        className='w-full rounded-lg border object-contain max-h-96'
        containerClassName='rounded-lg border'
        loadingOverlayClassName='rounded-lg'
        minHeight={384}
      />
    </div>
  );
}

