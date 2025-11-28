import {useState, useEffect, type ImgHTMLAttributes} from 'react';
import {LoadingSpinner} from '~/components/LoadingScreen';

interface ImageWithLoadingProps extends ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Custom loading component to show while image is loading.
   * If not provided, uses the default LoadingSpinner.
   */
  loadingComponent?: React.ReactNode;
  /**
   * Size of the loading spinner (if using default loading component).
   * @default 64
   */
  loadingSpinnerSize?: number;
  /**
   * Additional className for the container div.
   */
  containerClassName?: string;
  /**
   * Additional className for the loading overlay.
   */
  loadingOverlayClassName?: string;
  /**
   * Minimum height for the container while loading.
   * Prevents layout shift during image load.
   */
  minHeight?: string | number;
  /**
   * Minimum width for the container while loading.
   * Prevents layout shift during image load.
   */
  minWidth?: string | number;
}

/**
 * Image component that displays a loading spinner while the image is loading.
 * Handles loading states and errors gracefully.
 */
export function ImageWithLoading({
  src,
  alt,
  loadingComponent,
  loadingSpinnerSize = 64,
  containerClassName = '',
  loadingOverlayClassName = '',
  className = '',
  minHeight,
  minWidth,
  onLoad,
  onError,
  ...imgProps
}: ImageWithLoadingProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset loading state when src changes
  useEffect(() => {
    if (src) {
      setImageLoading(true);
      setHasError(false);
    } else {
      setImageLoading(false);
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageLoading(false);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageLoading(false);
    setHasError(true);
    onError?.(e);
  };

  const defaultLoadingComponent = (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg border ${loadingOverlayClassName}`}
    >
      <LoadingSpinner size={loadingSpinnerSize} />
    </div>
  );

  // Only apply minHeight/minWidth while loading to prevent layout shift
  // Once loaded, container will resize to match image dimensions
  const containerStyle: React.CSSProperties = {};
  if (imageLoading && !hasError) {
    if (minHeight !== undefined) {
      containerStyle.minHeight =
        typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
    }
    if (minWidth !== undefined) {
      containerStyle.minWidth =
        typeof minWidth === 'number' ? `${minWidth}px` : minWidth;
    }
  }

  return (
    <div
      className={`relative ${containerClassName}`}
      style={containerStyle}
    >
      {imageLoading && !hasError && (
        <>
          {loadingComponent ?? defaultLoadingComponent}
        </>
      )}
      {src && (
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          style={{display: imageLoading ? 'none' : 'block'}}
          {...imgProps}
        />
      )}
      {hasError && (
        <div
          className='flex items-center justify-center bg-muted/50 rounded-lg border p-8 text-center'
          style={containerStyle}
        >
          <p className='text-sm text-muted-foreground'>
            No se pudo cargar la imagen
          </p>
        </div>
      )}
    </div>
  );
}

