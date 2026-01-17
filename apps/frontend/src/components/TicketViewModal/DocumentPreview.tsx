import {ImageWithLoading} from '~/components';
import {Button} from '~/components/ui/button';
import {FileText, ExternalLink, Download} from 'lucide-react';
import {isImageFile, getFullFileUrl} from './utils';

interface DocumentPreviewProps {
  url: string;
  ticketId: string;
  mimeType?: string | null;
  originalName?: string | null;
  showDownload?: boolean;
  onDownload?: () => void;
}

export function DocumentPreview({
  url,
  ticketId,
  mimeType,
  originalName,
  showDownload = true,
  onDownload,
}: DocumentPreviewProps) {
  const fullUrl = getFullFileUrl(url);
  const isImage = isImageFile(mimeType);
  const isPdf = mimeType === 'application/pdf';

  if (isImage) {
    return (
      <div className='space-y-4'>
        <div className='rounded-lg border overflow-hidden bg-muted/30'>
          <ImageWithLoading
            src={fullUrl}
            alt={`Ticket ${ticketId}`}
            className='w-full object-contain max-h-[400px]'
            containerClassName='rounded-lg'
            loadingOverlayClassName='rounded-lg'
            minHeight={200}
          />
        </div>
        {showDownload && (
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' asChild className='flex-1'>
              <a href={fullUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='h-4 w-4' />
                Abrir en nueva pestaña
              </a>
            </Button>
            {onDownload && (
              <Button onClick={onDownload} size='sm' className='flex-1'>
                <Download className='h-4 w-4' />
                Descargar
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className='space-y-4'>
        <div className='rounded-lg border overflow-hidden bg-muted/30 p-8'>
          <div className='flex flex-col items-center justify-center gap-4'>
            <FileText className='h-16 w-16 text-muted-foreground' />
            <p className='text-sm text-muted-foreground text-center'>
              {originalName ? `Archivo PDF: ${originalName}` : 'Documento PDF'}
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' asChild className='flex-1'>
            <a href={fullUrl} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='h-4 w-4' />
              Abrir PDF
            </a>
          </Button>
          {onDownload && (
            <Button onClick={onDownload} size='sm' className='flex-1'>
              <Download className='h-4 w-4' />
              Descargar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Unknown file type - show generic download
  return (
    <div className='space-y-4'>
      <div className='rounded-lg border overflow-hidden bg-muted/30 p-8'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <FileText className='h-16 w-16 text-muted-foreground' />
          <p className='text-sm text-muted-foreground text-center'>
            {originalName || 'Documento'}
          </p>
        </div>
      </div>
      {onDownload && (
        <Button onClick={onDownload} className='w-full'>
          <Download className='h-4 w-4' />
          Descargar
        </Button>
      )}
    </div>
  );
}
