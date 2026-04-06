import {Link} from '@tanstack/react-router';
import {
  FileCheck,
  Clock,
  XCircle,
  AlertTriangle,
  Flag,
  ExternalLink,
} from 'lucide-react';
import {Button} from '~/components/ui/button';
import type {GetOrderTicketsResponse} from '~/lib/api/generated';
import {TicketIdHero} from './TicketIds';
import {DocumentPreview} from './DocumentPreview';
import {SlideDetailsAccordion} from './SlideDetailsAccordion';

export type OrderTicket = GetOrderTicketsResponse['tickets'][number];

interface TicketSlideProps {
  ticket: OrderTicket;
  orderIdFromData: string | undefined;
  currency: string | undefined;
  subtotalAmount: string | undefined;
  totalAmount: string | undefined;
  platformCommission: string | undefined;
  vatOnCommission: string | undefined;
  isReportPending: boolean;
  onDownload: (ticket: OrderTicket) => void;
  onReport: (ticket: OrderTicket) => void;
}

export function TicketSlide({
  ticket,
  orderIdFromData,
  currency,
  subtotalAmount,
  totalAmount,
  platformCommission,
  vatOnCommission,
  isReportPending,
  onDownload,
  onReport,
}: TicketSlideProps) {
  return (
    <div className='space-y-3 pb-2'>
      <TicketIdHero
        ticketId={ticket.id}
        waveName={ticket.ticketWave?.name}
      />

      {ticket.reservationStatus === 'cancelled' ? (
        <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3 min-h-[200px] flex flex-col items-center justify-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10'>
            <AlertTriangle className='h-7 w-7 text-destructive' />
          </div>
          <div className='space-y-1'>
            <p className='font-semibold text-destructive'>
              Entrada cancelada
            </p>
            <p className='text-sm text-muted-foreground max-w-[280px]'>
              El vendedor no subió el documento a tiempo. Tu
              reembolso está en proceso.
            </p>
          </div>
          {ticket.report && (
            <Button variant='outline' size='sm' asChild>
              <Link
                to='/cuenta/reportes/$reportId'
                params={{reportId: ticket.report.id}}
              >
                <ExternalLink className='h-4 w-4' />
                Ver mi caso
              </Link>
            </Button>
          )}
        </div>
      ) : ticket.reservationStatus === 'refunded' ? (
        <div className='rounded-lg border border-muted bg-muted/30 p-6 text-center space-y-3 min-h-[200px] flex flex-col items-center justify-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
            <XCircle className='h-7 w-7 text-muted-foreground' />
          </div>
          <div className='space-y-1'>
            <p className='font-semibold text-foreground'>
              Entrada reembolsada
            </p>
            <p className='text-sm text-muted-foreground max-w-[280px]'>
              Ya se procesó el reembolso por esta entrada.
            </p>
          </div>
          {ticket.report && (
            <Button variant='outline' size='sm' asChild>
              <Link
                to='/cuenta/reportes/$reportId'
                params={{reportId: ticket.report.id}}
              >
                <ExternalLink className='h-4 w-4' />
                Ver mi caso
              </Link>
            </Button>
          )}
        </div>
      ) : ticket.reservationStatus === 'refund_pending' ? (
        <div className='rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6 text-center space-y-3 min-h-[200px] flex flex-col items-center justify-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10'>
            <Clock className='h-7 w-7 text-yellow-600' />
          </div>
          <div className='space-y-1'>
            <p className='font-semibold text-yellow-700'>
              Reembolso en proceso
            </p>
            <p className='text-sm text-muted-foreground max-w-[280px]'>
              Estamos procesando tu reembolso. Te avisamos
              cuando se acredite.
            </p>
          </div>
          {ticket.report && (
            <Button variant='outline' size='sm' asChild>
              <Link
                to='/cuenta/reportes/$reportId'
                params={{reportId: ticket.report.id}}
              >
                <ExternalLink className='h-4 w-4' />
                Ver mi caso
              </Link>
            </Button>
          )}
        </div>
      ) : ticket.hasDocument && ticket.document?.url ? (
        <div className='space-y-3'>
          <div className='flex items-center gap-2 text-sm'>
            <FileCheck className='h-4 w-4 text-green-500' />
            <span className='text-green-600 font-medium'>
              Entrada disponible
            </span>
          </div>
          <DocumentPreview
            url={ticket.document.url}
            ticketId={ticket.id}
            mimeType={ticket.document.mimeType}
            onDownload={() => onDownload(ticket)}
            onReport={() => onReport(ticket)}
            isReportDisabled={isReportPending}
          />
        </div>
      ) : (
        <div className='rounded-lg border border-dashed bg-muted/30 p-6 text-center space-y-3'>
          <div className='flex justify-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
              <Clock className='h-6 w-6 text-muted-foreground' />
            </div>
          </div>
          <div className='space-y-1'>
            <p className='font-medium text-foreground'>
              Entrada aún no disponible
            </p>
            <p className='text-sm text-muted-foreground'>
              El vendedor todavía no subió el documento. Te
              avisamos cuando esté listo.
            </p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 text-xs text-muted-foreground hover:text-destructive'
            disabled={isReportPending}
            onClick={() => onReport(ticket)}
          >
            <Flag className='h-3.5 w-3.5 mr-1' />
            Reportar problema
          </Button>
        </div>
      )}

      <SlideDetailsAccordion
        ticketId={ticket.id}
        orderId={orderIdFromData}
        ticketWaveName={ticket.ticketWave?.name}
        price={ticket.price}
        currency={currency}
        subtotalAmount={subtotalAmount}
        totalAmount={totalAmount}
        platformCommission={platformCommission}
        vatOnCommission={vatOnCommission}
      />
    </div>
  );
}
