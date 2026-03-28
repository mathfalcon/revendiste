import {useState, useEffect} from 'react';
import {Button} from '~/components/ui/button';
import {ArrowLeft, ChevronLeft, ChevronRight} from 'lucide-react';
import {cn} from '~/lib/utils';
import {useStickyBar} from '~/contexts';
import {Progress} from '~/components/ui/progress';

interface MobileDocumentBarProps {
  currentIndex: number;
  quantity: number;
  completedCount: number;
  isFirst: boolean;
  isLast: boolean;
  allComplete: boolean;
  isPublishing: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPublish: () => void;
  onBack: () => void;
}

export function MobileDocumentBar({
  currentIndex,
  quantity,
  completedCount,
  isFirst,
  isLast,
  allComplete,
  isPublishing,
  onPrev,
  onNext,
  onPublish,
  onBack,
}: MobileDocumentBarProps) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const {registerStickyBar} = useStickyBar();

  useEffect(() => {
    const unregister = registerStickyBar();
    return unregister;
  }, [registerStickyBar]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateOffset = () => {
      const offset = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardOffset(Math.max(0, offset));
    };

    updateOffset();
    viewport.addEventListener('resize', updateOffset);
    viewport.addEventListener('scroll', updateOffset);

    return () => {
      viewport.removeEventListener('resize', updateOffset);
      viewport.removeEventListener('scroll', updateOffset);
    };
  }, []);

  const progressPercent = quantity > 0 ? (completedCount / quantity) * 100 : 0;

  return (
    <div
      className='fixed left-0 right-0 z-50 md:hidden transition-[bottom] duration-200 ease-out'
      style={{bottom: keyboardOffset}}
    >
      <div
        className={cn(
          'bg-background border-t safe-area-inset-bottom',
          'shadow-[0_-4px_12px_rgba(0,0,0,0.15)]',
        )}
      >
        {/* Progress bar */}
        <Progress value={progressPercent} className='h-1 rounded-none' />

        <div className='px-4 py-3 space-y-2.5'>
          {/* Top row: Carousel navigation */}
          {quantity > 1 && (
            <div className='flex items-center justify-center gap-3'>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 shrink-0'
                onClick={onPrev}
                disabled={isFirst}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <div className='text-sm text-center'>
                <span className='font-medium tabular-nums'>
                  Entrada {currentIndex + 1} de {quantity}
                </span>
                <span className='text-muted-foreground ml-1.5'>
                  · {completedCount} listo{completedCount !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 shrink-0'
                onClick={onNext}
                disabled={isLast}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          )}

          {/* Hint when not all complete */}
          {!allComplete && (
            <p className='text-xs text-muted-foreground text-center'>
              Subí todos los documentos para publicar
            </p>
          )}

          {/* Bottom row: Back + Publish */}
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              className='flex-1 h-10'
              onClick={onBack}
            >
              <ArrowLeft className='h-4 w-4 mr-1.5' />
              Volver
            </Button>
            <Button
              className='bg-primary-gradient flex-1 h-10 font-semibold'
              disabled={!allComplete || isPublishing}
              onClick={onPublish}
            >
              {isPublishing ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
