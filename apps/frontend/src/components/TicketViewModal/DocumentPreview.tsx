import {ImageWithLoading} from '~/components';
import {Button} from '~/components/ui/button';
import {FileText, ExternalLink, Download, Flag} from 'lucide-react';
import {isImageFile, getFullFileUrl} from './utils';

interface DocumentPreviewProps {
  url: string;
  ticketId: string;
  mimeType?: string | null;
  originalName?: string | null;
  showDownload?: boolean;
  onDownload?: () => void;
  onReport?: () => void;
  isReportDisabled?: boolean;
}

function ActionButtons({
  fullUrl,
  onDownload,
  onReport,
  isReportDisabled,
  openLabel = 'Abrir',
}: {
  fullUrl: string;
  onDownload?: () => void;
  onReport?: () => void;
  isReportDisabled?: boolean;
  openLabel?: string;
}) {
  return (
    <div className='flex gap-2'>
      <Button variant='outline' size='sm' asChild className='flex-1 h-9'>
        <a href={fullUrl} target='_blank' rel='noopener noreferrer'>
          <ExternalLink className='h-4 w-4 mr-1.5' />
          {openLabel}
        </a>
      </Button>
      {onDownload && (
        <Button onClick={onDownload} size='sm' className='flex-1 h-9'>
          <Download className='h-4 w-4 mr-1.5' />
          Descargar
        </Button>
      )}
      {onReport && (
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive'
          disabled={isReportDisabled}
          onClick={onReport}
        >
          <Flag className='h-4 w-4' />
        </Button>
      )}
    </div>
  );
}

export function DocumentPreview({
  url,
  ticketId,
  mimeType,
  originalName,
  showDownload = true,
  onDownload,
  onReport,
  isReportDisabled,
}: DocumentPreviewProps) {
  const fullUrl = getFullFileUrl(url);
  const isImage = isImageFile(mimeType);
  const isPdf = mimeType === 'application/pdf';

  if (isImage) {
    return (
      <div className='space-y-3'>
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
          <ActionButtons
            fullUrl={fullUrl}
            onDownload={onDownload}
            onReport={onReport}
            isReportDisabled={isReportDisabled}
          />
        )}
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className='space-y-3'>
        <div className='rounded-lg border overflow-hidden bg-muted/30 p-8'>
          <div className='flex flex-col items-center justify-center gap-4'>
            <FileText className='h-16 w-16 text-muted-foreground' />
            <p className='text-sm text-muted-foreground text-center'>
              {originalName ? `PDF: ${originalName}` : 'Documento PDF'}
            </p>
          </div>
        </div>
        <ActionButtons
          fullUrl={fullUrl}
          onDownload={onDownload}
          onReport={onReport}
          isReportDisabled={isReportDisabled}
          openLabel='Abrir PDF'
        />
      </div>
    );
  }

  // Unknown file type
  return (
    <div className='space-y-3'>
      <div className='rounded-lg border overflow-hidden bg-muted/30 p-8'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <FileText className='h-16 w-16 text-muted-foreground' />
          <p className='text-sm text-muted-foreground text-center'>
            {originalName || 'Documento'}
          </p>
        </div>
      </div>
      <div className='flex gap-2'>
        {onDownload && (
          <Button onClick={onDownload} size='sm' className='flex-1 h-9'>
            <Download className='h-4 w-4 mr-1.5' />
            Descargar
          </Button>
        )}
        {onReport && (
          <Button
            variant='ghost'
            size='icon'
            className='h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive'
            disabled={isReportDisabled}
            onClick={onReport}
          >
            <Flag className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
}
