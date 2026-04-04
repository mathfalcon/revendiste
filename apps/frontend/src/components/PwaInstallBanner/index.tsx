import {useEffect, useState} from 'react';
import {useAuth} from '@clerk/tanstack-react-start';
import {useLocation} from '@tanstack/react-router';
import {Download, Share, Plus, X} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '~/components/ui/sheet';
import {usePwaInstall} from '~/hooks';

const MIN_NAVIGATIONS = 2;
const NAVIGATION_KEY = 'revendiste:pwa-nav-count';

export function PwaInstallBanner() {
  const {isSignedIn} = useAuth();
  const location = useLocation();
  const {
    canPrompt,
    isIos,
    showIosSheet,
    promptInstall,
    dismiss,
    dismissForever,
    closeIosSheet,
  } = usePwaInstall();

  const [hasEnoughNavigations, setHasEnoughNavigations] = useState(false);

  // Track navigations in sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const count = parseInt(sessionStorage.getItem(NAVIGATION_KEY) || '0', 10);
    const newCount = count + 1;
    sessionStorage.setItem(NAVIGATION_KEY, String(newCount));

    if (newCount >= MIN_NAVIGATIONS) {
      setHasEnoughNavigations(true);
    }
  }, [location.pathname]);

  const visible = hasEnoughNavigations && canPrompt && isSignedIn;

  if (!visible) {
    return <IosInstructionsSheet open={showIosSheet} onClose={closeIosSheet} />;
  }

  return (
    <>
      <div className='fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300 safe-area-pb'>
        <div className='border-t bg-background shadow-lg p-4'>
          <div className='flex items-start gap-3'>
            <img
              src='/android-chrome-192x192.png'
              alt='Revendiste'
              className='h-10 w-10 rounded-xl flex-shrink-0'
            />
            <div className='flex-1 min-w-0'>
              <p className='font-semibold text-sm'>Instalá Revendiste</p>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Recibí notificaciones y accedé más rápido desde tu pantalla de
                inicio.
              </p>
            </div>
            <button
              onClick={dismiss}
              className='text-muted-foreground hover:text-foreground -mt-0.5 -mr-1 p-1'
              aria-label='Cerrar'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
          <div className='flex items-center gap-2 mt-3'>
            <Button size='sm' className='flex-1' onClick={promptInstall}>
              <Download className='mr-1.5 h-4 w-4' />
              Instalar
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={dismiss}
            >
              Ahora no
            </Button>
          </div>
          <button
            className='w-full text-center text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors'
            onClick={dismissForever}
          >
            No mostrar de nuevo
          </button>
        </div>
      </div>

      <IosInstructionsSheet open={showIosSheet} onClose={closeIosSheet} />
    </>
  );
}

function IosInstructionsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={val => !val && onClose()}>
      <SheetContent side='bottom' className='rounded-t-2xl px-6 pb-8'>
        <SheetHeader className='text-left'>
          <SheetTitle>Instalá Revendiste en tu iPhone</SheetTitle>
          <SheetDescription className='sr-only'>
            Instrucciones para instalar la app
          </SheetDescription>
        </SheetHeader>

        <div className='mt-4 space-y-5'>
          <div className='flex items-start gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0'>
              <Share className='h-4 w-4' />
            </div>
            <div>
              <p className='text-sm font-medium'>1. Tocá el botón Compartir</p>
              <p className='text-xs text-muted-foreground mt-0.5'>
                En la barra inferior de Safari
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0'>
              <Plus className='h-4 w-4' />
            </div>
            <div>
              <p className='text-sm font-medium'>
                2. Tocá &quot;Agregar a pantalla de inicio&quot;
              </p>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Buscá la opción en el menú que se abre
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0'>
              <Download className='h-4 w-4' />
            </div>
            <div>
              <p className='text-sm font-medium'>
                3. Confirmá tocando &quot;Agregar&quot;
              </p>
            </div>
          </div>
        </div>

        <div className='mt-5 rounded-lg bg-muted/50 p-3'>
          <p className='text-xs text-muted-foreground'>
            Recibí notificaciones push de tus ventas y compras directamente en
            tu teléfono.
          </p>
        </div>

        <Button className='w-full mt-4' onClick={onClose}>
          Entendido
        </Button>
      </SheetContent>
    </Sheet>
  );
}
