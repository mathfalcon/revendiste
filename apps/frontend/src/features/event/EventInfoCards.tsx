import {useState} from 'react';
import {Clock, ShieldCheck, ChevronRight} from 'lucide-react';
import {QrAvailabilityDialog} from './QrAvailabilityDialog';
import type {QrAvailabilityTiming} from '~/lib/api/generated';

interface EventInfoCardsProps {
  qrAvailabilityTiming: QrAvailabilityTiming | null;
}

const QR_TIMING_LABELS: Record<QrAvailabilityTiming, string> = {
  '3h': '3 horas',
  '6h': '6 horas',
  '12h': '12 horas',
  '24h': '24 horas',
  '48h': '48 horas',
  '72h': '72 horas',
};

export function EventInfoCards({qrAvailabilityTiming}: EventInfoCardsProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
        {/* QR Availability Card */}
        {qrAvailabilityTiming && (
          <button
            onClick={() => setQrDialogOpen(true)}
            className='group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-left'
          >
            <div className='flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border flex-shrink-0'>
              <Clock className='w-4 h-4 text-muted-foreground' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-medium text-foreground leading-tight'>
                QR disponible {QR_TIMING_LABELS[qrAvailabilityTiming]} antes
              </p>
            </div>
            <ChevronRight className='w-4 h-4 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform flex-shrink-0' />
          </button>
        )}

        {/* Warranty Card */}
        <a
          href='/garantia'
          target='_blank'
          rel='noopener noreferrer'
          className='group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors'
        >
          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0'>
            <ShieldCheck className='w-4 h-4 text-primary' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-xs font-medium text-foreground leading-tight'>
              Compra protegida por Garantía Revendiste
            </p>
          </div>
          <ChevronRight className='w-4 h-4 text-primary/50 group-hover:translate-x-0.5 transition-transform flex-shrink-0' />
        </a>
      </div>

      {qrAvailabilityTiming && (
        <QrAvailabilityDialog
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          qrAvailabilityTiming={qrAvailabilityTiming}
        />
      )}
    </>
  );
}
