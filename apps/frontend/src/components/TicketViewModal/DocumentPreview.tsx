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
    <div className='flex gap-2 justify-center'>
      <Button variant='outline' size='sm' asChild className='h-9'>
        <a href={fullUrl} target='_blank' rel='noopener noreferrer'>
          <ExternalLink className='h-4 w-4 min-[420px]:mr-1.5' />
          <span className='hidden min-[420px]:inline'>{openLabel}</span>
        </a>
      </Button>
      {onDownload && (
        <Button onClick={onDownload} size='sm' className='h-9'>
          <Download className='h-4 w-4 min-[420px]:mr-1.5' />
          <span className='hidden min-[420px]:inline'>Descargar</span>
        </Button>
      )}
      {onReport && (
        <Button
          variant='ghost'
          size='sm'
          className='h-9 text-muted-foreground hover:text-destructive'
          disabled={isReportDisabled}
          onClick={onReport}
        >
          <Flag className='h-4 w-4 mr-1.5' />
          Reportar
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
        <div className='aspect-square max-w-[358px] mx-auto rounded-lg border overflow-hidden bg-muted/30 flex items-center justify-center'>
          <ImageWithLoading
            src={fullUrl}
            alt={`Ticket ${ticketId}`}
            className='w-full h-full object-contain'
            containerClassName='w-full h-full rounded-lg'
            loadingOverlayClassName='rounded-lg'
            minHeight='100%'
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
        <div className='aspect-square max-w-[358px] mx-auto rounded-lg border overflow-hidden bg-muted/30 flex flex-col items-center justify-center gap-4'>
          <FileText className='h-16 w-16 text-muted-foreground' />
          <p className='text-sm text-muted-foreground text-center'>
            {originalName ? `PDF: ${originalName}` : 'Documento PDF'}
          </p>
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
      <div className='aspect-square rounded-lg border overflow-hidden bg-muted/30 flex flex-col items-center justify-center gap-4'>
        <FileText className='h-16 w-16 text-muted-foreground' />
        <p className='text-sm text-muted-foreground text-center'>
          {originalName || 'Documento'}
        </p>
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
            size='sm'
            className='h-9 shrink-0 text-muted-foreground hover:text-destructive'
            disabled={isReportDisabled}
            onClick={onReport}
          >
            <Flag className='h-4 w-4 mr-1.5' />
            Reportar
          </Button>
        )}
      </div>
    </div>
  );
}
