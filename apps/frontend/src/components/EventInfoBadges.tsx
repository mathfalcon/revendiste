import {useState} from 'react';
import {Clock, QrCode} from 'lucide-react';
import {QrAvailabilityDialog} from '~/features/event/QrAvailabilityDialog';
import type {QrAvailabilityTiming} from '~/lib/api/generated';
import {cn} from '~/lib/utils';

interface EventInfoBadgesProps {
  qrAvailabilityTiming?: QrAvailabilityTiming | null;
  // Add more event properties here as needed for future badges
  // e.g., isVerified?: boolean;
  // e.g., hasWarranty?: boolean;
  className?: string;
  /** 'buyer' shows purchase-focused content, 'seller' shows upload obligations */
  viewMode?: 'buyer' | 'seller';
}

const QR_TIMING_LABELS: Record<QrAvailabilityTiming, string> = {
  '3h': '3h',
  '6h': '6h',
  '12h': '12h',
  '24h': '24h',
  '48h': '48h',
  '72h': '72h',
};

/**
 * Renders informational badges for an event.
 * Use this component in cards or compact layouts.
 * For the main event page overlay badges, use EventBadges from features/event instead.
 */
export function EventInfoBadges({
  qrAvailabilityTiming,
  className,
  viewMode = 'buyer',
}: EventInfoBadgesProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Don't render anything if there are no badges to show
  if (!qrAvailabilityTiming) {
    return null;
  }

  return (
    <>
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {/* QR Availability Badge */}
        {qrAvailabilityTiming && (
          <button
            type='button'
            onClick={() => setQrDialogOpen(true)}
            className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium transition-colors hover:bg-purple-500/20'
          >
            <QrCode className='w-3 h-3' />
            <span>{QR_TIMING_LABELS[qrAvailabilityTiming]} antes</span>
          </button>
        )}

        {/* Add more badges here as needed */}
        {/* Example: Verified badge */}
        {/* {isVerified && (
          <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium'>
            <BadgeCheck className='w-3 h-3' />
            <span>Verificado</span>
          </span>
        )} */}
      </div>

      {qrAvailabilityTiming && (
        <QrAvailabilityDialog
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          qrAvailabilityTiming={qrAvailabilityTiming}
          viewMode={viewMode}
        />
      )}
    </>
  );
}
