import {useState, useEffect} from 'react';
import {Button} from '~/components/ui/button';
import {ChevronUp} from 'lucide-react';
import {formatPrice} from '~/utils';
import {cn} from '~/lib/utils';
import {useStickyBar} from '~/contexts';
import {Separator} from '~/components/ui/separator';
import {Link} from '@tanstack/react-router';

interface SellerAmountCalculation {
  sellerAmount: number;
  platformCommission: number;
  vatOnCommission: number;
  currency: string;
}

interface MobilePublishBarProps {
  price: number;
  quantity: number;
  currency: string;
  sellerAmountCalculation: SellerAmountCalculation;
  isPending: boolean;
}

export function MobilePublishBar({
  price,
  quantity,
  currency,
  sellerAmountCalculation,
  isPending,
}: MobilePublishBarProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const {registerStickyBar} = useStickyBar();

  // Register this sticky bar when mounted
  useEffect(() => {
    const unregister = registerStickyBar();
    return unregister;
  }, [registerStickyBar]);

  // Track visual viewport to stay above keyboard on iOS Safari
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateOffset = () => {
      const offset = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardOffset(Math.max(0, offset));
    };

    // Check immediately on mount (keyboard might already be open)
    updateOffset();

    viewport.addEventListener('resize', updateOffset);
    viewport.addEventListener('scroll', updateOffset);

    return () => {
      viewport.removeEventListener('resize', updateOffset);
      viewport.removeEventListener('scroll', updateOffset);
    };
  }, []);

  // Disable body scroll when summary is expanded
  useEffect(() => {
    if (isSummaryExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSummaryExpanded]);

  const toggleSummary = () => setIsSummaryExpanded(!isSummaryExpanded);

  const totalSellerAmount = sellerAmountCalculation.sellerAmount * quantity;

  return (
    <>
      {/* Backdrop overlay when summary is expanded */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300',
          isSummaryExpanded
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsSummaryExpanded(false)}
      />

      <div
        className='fixed left-0 right-0 z-50 md:hidden transition-[bottom] duration-200 ease-out'
        style={{bottom: keyboardOffset}}
      >
        <div
          className={cn(
            'bg-background border-t safe-area-inset-bottom transition-shadow duration-300',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.15)]',
            isSummaryExpanded && 'shadow-[0_-8px_24px_rgba(0,0,0,0.2)]',
          )}
        >
          {/* Expandable Summary */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              isSummaryExpanded ? 'max-h-96' : 'max-h-0',
            )}
          >
            <div className='px-4 pt-4 pb-2 space-y-3 border-b'>
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    Precio por entrada
                  </span>
                  <span className='font-medium'>
                    {formatPrice(price, currency)}
                  </span>
                </div>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-muted-foreground'>Comisión (6%)</span>
                  <span className='text-muted-foreground'>
                    -{formatPrice(sellerAmountCalculation.platformCommission, currency)}
                  </span>
                </div>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-muted-foreground'>
                    IVA sobre comisión (22%)
                  </span>
                  <span className='text-muted-foreground'>
                    -{formatPrice(sellerAmountCalculation.vatOnCommission, currency)}
                  </span>
                </div>
                <Separator />
                <div className='flex justify-between items-center'>
                  <span className='font-semibold'>Recibirás por entrada</span>
                  <span className='font-bold text-primary'>
                    {formatPrice(sellerAmountCalculation.sellerAmount, currency)}
                  </span>
                </div>
                {quantity > 1 && (
                  <div className='flex justify-between items-center pt-2 border-t'>
                    <span className='text-sm text-muted-foreground'>
                      Total ({quantity} entradas)
                    </span>
                    <span className='font-bold'>
                      {formatPrice(totalSellerAmount, currency)}
                    </span>
                  </div>
                )}
              </div>
              <p className='text-xs text-muted-foreground'>
                El dinero será retenido por la{' '}
                <Link
                  to='/garantia'
                  className='text-primary underline'
                  onClick={e => e.stopPropagation()}
                >
                  Garantía Revendiste
                </Link>{' '}
                y estará disponible 48 horas después del evento.
              </p>
            </div>
          </div>

          {/* Main Bar */}
          <div className='px-4 py-3 cursor-pointer' onClick={toggleSummary}>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex flex-col min-w-0 text-left flex-1'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground'>
                    Recibirás{quantity > 1 ? ` (${quantity} entradas)` : ''}
                  </span>
                  <ChevronUp
                    className={cn(
                      'w-3.5 h-3.5 text-muted-foreground transition-transform duration-300',
                      isSummaryExpanded && 'rotate-180',
                    )}
                  />
                </div>
                <span className='font-bold text-lg text-primary'>
                  {formatPrice(totalSellerAmount, currency)}
                </span>
              </div>
              <Button
                type='submit'
                className='bg-primary-gradient h-12 px-8 text-base font-semibold'
                disabled={isPending}
                onClick={e => e.stopPropagation()}
              >
                {isPending ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
