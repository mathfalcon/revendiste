import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Ticket, Upload, FileCheck, AlertCircle, Timer} from 'lucide-react';
import {formatPrice} from '~/utils/string';
import type {ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets} from '~/lib';

interface SoldTicketsSectionProps {
  tickets: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number]['tickets'];
  ticketWaveName: string;
  ticketWaveCurrency: string;
  onUploadClick: (ticketId: string) => void;
}

export function SoldTicketsSection({
  tickets,
  ticketWaveName,
  ticketWaveCurrency,
  onUploadClick,
}: SoldTicketsSectionProps) {
  if (tickets.length === 0) {
    return null;
  }

  return (
    <AccordionItem value='sold-tickets' className='border-none'>
      <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline'>
        <div className='flex items-center gap-2'>
          <Ticket className='h-4 w-4 text-green-600' />
          Tickets vendidos ({tickets.length})
        </div>
      </AccordionTrigger>
      <AccordionContent className='pl-6'>
        <div className='space-y-2'>
          {tickets.map(ticket => {
            const hasDocument = ticket.hasDocument;
            const canUpload = ticket.canUploadDocument;
            const documentNeedsAttention = false; // For future: check if status is 'rejected' or 'pending'

            // Determine button state
            let buttonConfig: {
              bgClass: string;
              icon: React.ReactNode;
              text: string;
              onClick: () => void;
              disabled: boolean;
              title?: string;
            };

            if (!canUpload) {
              // Can't upload yet (too early based on platform rules)
              buttonConfig = {
                bgClass:
                  'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed',
                icon: <Timer className='h-3.5 w-3.5' />,
                text: 'Próximamente',
                onClick: () => {},
                disabled: true,
                title: 'Los tickets estarán disponibles 12 horas antes del evento',
              };
            } else if (hasDocument) {
              // Has document - show edit/update option
              if (documentNeedsAttention) {
                buttonConfig = {
                  bgClass:
                    'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300',
                  icon: <AlertCircle className='h-3.5 w-3.5' />,
                  text: 'Revisar',
                  onClick: () => onUploadClick(ticket.id),
                  disabled: false,
                };
              } else {
                buttonConfig = {
                  bgClass:
                    'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300',
                  icon: <FileCheck className='h-3.5 w-3.5' />,
                  text: 'Editar',
                  onClick: () => onUploadClick(ticket.id),
                  disabled: false,
                };
              }
            } else {
              // No document and can upload - show upload prompt
              buttonConfig = {
                bgClass:
                  'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300',
                icon: <Upload className='h-3.5 w-3.5' />,
                text: 'Subir ticket',
                onClick: () => onUploadClick(ticket.id),
                disabled: false,
              };
            }

            return (
              <div
                key={ticket.id}
                className='rounded-lg border border-green-200 bg-muted/50 p-3 text-sm'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='space-y-1 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium'>Ticket #{ticket.ticketNumber}</p>
                      <p className='text-xs text-muted-foreground font-mono'>
                        (ID: {ticket.id})
                      </p>
                    </div>
                    <p className='text-xs text-muted-foreground'>{ticketWaveName}</p>
                    <p className='text-muted-foreground'>
                      Vendido por:{' '}
                      {formatPrice(parseFloat(ticket.price), ticketWaveCurrency)}
                    </p>
                  </div>

                  {/* Upload Document Button */}
                  <button
                    onClick={buttonConfig.onClick}
                    disabled={buttonConfig.disabled}
                    title={buttonConfig.title}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${buttonConfig.bgClass}`}
                  >
                    {buttonConfig.icon}
                    {buttonConfig.text}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

