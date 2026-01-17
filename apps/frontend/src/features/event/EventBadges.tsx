import {useState} from 'react';
import {Link} from '@tanstack/react-router';
import {Clock, ShieldCheck} from 'lucide-react';
import {QrAvailabilityDialog} from './QrAvailabilityDialog';
import type {QrAvailabilityTiming} from '~/lib/api/generated';

interface EventBadgesProps {
  qrAvailabilityTiming: QrAvailabilityTiming | null;
}

const QR_TIMING_LABELS: Record<QrAvailabilityTiming, string> = {
  '3h': '3h',
  '6h': '6h',
  '12h': '12h',
  '24h': '24h',
  '48h': '48h',
  '72h': '72h',
};

export function EventBadges({qrAvailabilityTiming}: EventBadgesProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  return (
    <>
      <div className='flex flex-wrap gap-2'>
        {/* QR Availability Badge */}
        {qrAvailabilityTiming && (
          <button
            onClick={() => setQrDialogOpen(true)}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-sm transition-colors shadow-lg'
          >
            <Clock className='w-3.5 h-3.5' />
            <span>QR {QR_TIMING_LABELS[qrAvailabilityTiming]} antes</span>
          </button>
        )}

        {/* Warranty Badge */}
        <Link
          to='/garantia'
          className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-primary text-xs font-medium backdrop-blur-sm transition-colors shadow-lg'
        >
          <ShieldCheck className='w-3.5 h-3.5' />
          <span>Garantía Revendiste</span>
        </Link>
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
