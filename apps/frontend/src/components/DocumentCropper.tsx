import {useState, useCallback, useEffect} from 'react';
import Cropper, {type Area, type Point} from 'react-easy-crop';
import {heicTo} from 'heic-to';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Slider} from '~/components/ui/slider';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  X,
  CreditCard,
  Loader2,
} from 'lucide-react';

// HEIC/HEIF MIME types that need conversion
const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];

/**
 * Check if a file is a HEIC/HEIF image
 */
function isHeicFile(file: File): boolean {
  // Check MIME type
  if (HEIC_MIME_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }
  // Also check file extension as some browsers don't set MIME type correctly
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension === 'heic' || extension === 'heif';
}

/**
 * Convert HEIC/HEIF file to JPEG blob using heic-to library
 * heic-to uses a more recent version of libheif with better format support
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
  const jpegBlob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.9,
  });
  return jpegBlob;
}

interface DocumentCropperProps {
  /** Image file or URL to crop */
  image: File | string;
  /** Called when user confirms the crop */
  onCropComplete: (croppedBlob: Blob) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Aspect ratio for the crop area (default: 1.586 - standard ID card ratio) */
  aspectRatio?: number;
  /** Whether the cropper is in a loading state */
  isLoading?: boolean;
}

// Standard ID card aspect ratio (85.6mm x 53.98mm ≈ 1.586)
const ID_CARD_ASPECT_RATIO = 1.586;

/**
 * Creates a cropped image from canvas
 */
async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const {width: bBoxWidth, height: bBoxHeight} = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create a new canvas for the cropped area
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No 2d context');
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  // Return as blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.9, // Quality
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(
  width: number,
  height: number,
  rotation: number,
): {width: number; height: number} {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export function DocumentCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = ID_CARD_ASPECT_RATIO,
  isLoading = false,
}: DocumentCropperProps) {
  const [crop, setCrop] = useState<Point>({x: 0, y: 0});
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Process image: convert HEIC if needed, then create object URL
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function processImage() {
      setConversionError(null);

      // If it's already a string URL, use it directly
      if (typeof image === 'string') {
        setImageUrl(image);
        setIsConverting(false);
        return;
      }

      // Check if HEIC conversion is needed
      if (isHeicFile(image)) {
        setIsConverting(true);
        try {
          const jpegBlob = await convertHeicToJpeg(image);
          if (cancelled) return;
          objectUrl = URL.createObjectURL(jpegBlob);
          setImageUrl(objectUrl);
        } catch (error) {
          console.error('Error converting HEIC:', error);
          if (cancelled) return;
          setConversionError(
            'No se pudo procesar la imagen. Intenta con otro formato.',
          );
        } finally {
          if (!cancelled) {
            setIsConverting(false);
          }
        }
      } else {
        // Regular image, just create object URL
        objectUrl = URL.createObjectURL(image);
        setImageUrl(objectUrl);
        setIsConverting(false);
      }
    }

    processImage();

    // Cleanup object URL when component unmounts or image changes
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [image]);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !imageUrl) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImage(
        imageUrl,
        croppedAreaPixels,
        rotation,
      );
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
      // URL cleanup happens in useEffect when component unmounts
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <CreditCard className='h-5 w-5' />
          Ajustar Documento
        </CardTitle>
        <CardDescription>
          Posiciona tu documento dentro del rectángulo. Puedes hacer zoom y
          rotar la imagen.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 p-0'>
        {/* Cropper Area */}
        <div className='relative h-[350px] w-full bg-black/95'>
          {/* Loading state during HEIC conversion */}
          {isConverting && (
            <div className='absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/95'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
              <p className='text-sm text-white'>Procesando imagen...</p>
            </div>
          )}

          {/* Error state */}
          {conversionError && (
            <div className='absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/95 px-4'>
              <p className='text-center text-sm text-red-400'>
                {conversionError}
              </p>
              <Button variant='outline' size='sm' onClick={onCancel}>
                Volver
              </Button>
            </div>
          )}

          {/* Cropper - only show when image is ready */}
          {imageUrl && !isConverting && !conversionError && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
              cropShape='rect'
              showGrid={true}
              style={{
                containerStyle: {
                  backgroundColor: 'rgb(0 0 0 / 0.95)',
                },
                cropAreaStyle: {
                  border: '2px solid hsl(var(--primary))',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                },
              }}
            />
          )}

          {/* Overlay instruction */}
          {imageUrl && !isConverting && !conversionError && (
            <div className='pointer-events-none absolute inset-x-0 top-4 flex justify-center'>
              <div className='rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm'>
                Arrastrá para mover • Pellizca para zoom
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className='space-y-4 px-6 pb-6'>
          {/* Zoom slider */}
          <div className='flex items-center gap-3'>
            <ZoomOut className='h-4 w-4 text-muted-foreground' />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={values => setZoom(values[0] ?? 1)}
              className='flex-1'
            />
            <ZoomIn className='h-4 w-4 text-muted-foreground' />
          </div>

          {/* Rotate button */}
          <div className='flex justify-center'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleRotate}
              className='gap-2'
            >
              <RotateCw className='h-4 w-4' />
              Rotar 90°
            </Button>
          </div>

          {/* Action buttons */}
          <div className='flex gap-3 pt-2'>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={onCancel}
              disabled={isLoading || isProcessing}
            >
              <X className='mr-2 h-4 w-4' />
              Cancelar
            </Button>
            <Button
              type='button'
              className='flex-1'
              onClick={handleConfirm}
              disabled={
                isLoading ||
                isProcessing ||
                isConverting ||
                !croppedAreaPixels ||
                !imageUrl ||
                !!conversionError
              }
            >
              {isProcessing ? (
                'Procesando...'
              ) : (
                <>
                  <Check className='mr-2 h-4 w-4' />
                  Confirmar
                </>
              )}
            </Button>
          </div>

          {/* Helper text */}
          <p className='text-center text-xs text-muted-foreground'>
            💡 El rectángulo debe contener todo tu documento para una mejor
            lectura
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
