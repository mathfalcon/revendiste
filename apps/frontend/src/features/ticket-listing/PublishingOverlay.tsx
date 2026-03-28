import {LoadingSpinner} from '~/components/LoadingScreen';

export function PublishingOverlay() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] space-y-4'>
      <LoadingSpinner size={96} />
      <div className='text-center space-y-1'>
        <p className='text-sm font-medium'>Publicando tus entradas...</p>
        <p className='text-xs text-muted-foreground'>
          Esto puede tardar unos segundos
        </p>
      </div>
    </div>
  );
}
