import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {
  uploadEventImageMutation,
  deleteEventImageMutation,
} from '~/lib/api/admin';
import {toast} from 'sonner';
import {Upload, X, Loader2} from 'lucide-react';
import type {AdminEventDetail} from '~/lib/api/admin/admin-event-types';

interface EventImagesSectionProps {
  event: AdminEventDetail;
}

export function EventImagesSection({event}: EventImagesSectionProps) {
  const queryClient = useQueryClient();

  const uploadImageMutation = useMutation({
    ...uploadEventImageMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events', event.id]});
      toast.success('Imagen subida');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al subir la imagen');
    },
  });

  const deleteImageMutation = useMutation({
    ...deleteEventImageMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events', event.id]});
      toast.success('Imagen eliminada');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al eliminar la imagen',
      );
    },
  });

  const handleImageUpload = async (file: File, imageType: 'flyer' | 'hero') => {
    uploadImageMutation.mutate({eventId: event.id, file, imageType});
  };

  const flyerImage = event.images?.find(img => img.imageType === 'flyer');
  const heroImage = event.images?.find(img => img.imageType === 'hero');

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Imágenes</CardTitle>
        <CardDescription>Gestiona las imágenes del evento</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Flyer */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Flyer</label>
          <div className='flex items-start gap-4'>
            {flyerImage ? (
              <div className='relative'>
                <img
                  src={flyerImage.url}
                  alt='Flyer'
                  className='h-40 w-auto rounded border object-cover'
                />
                <Button
                  variant='destructive'
                  size='icon'
                  className='absolute -right-2 -top-2 h-6 w-6'
                  onClick={() =>
                    deleteImageMutation.mutate({
                      eventId: event.id,
                      imageId: flyerImage.id,
                    })
                  }
                  disabled={deleteImageMutation.isPending}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ) : (
              <div className='flex h-40 w-32 items-center justify-center rounded border-2 border-dashed'>
                <span className='text-sm text-muted-foreground'>
                  Sin imagen
                </span>
              </div>
            )}
            <div>
              <label htmlFor='flyer-upload'>
                <Button
                  variant='outline'
                  asChild
                  disabled={uploadImageMutation.isPending}
                >
                  <span className='cursor-pointer'>
                    <Upload className='mr-2 h-4 w-4' />
                    {uploadImageMutation.isPending
                      ? 'Subiendo...'
                      : 'Subir Flyer'}
                  </span>
                </Button>
              </label>
              <input
                id='flyer-upload'
                type='file'
                accept='image/*'
                className='hidden'
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'flyer');
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Hero</label>
          <div className='flex items-start gap-4'>
            {heroImage ? (
              <div className='relative'>
                <img
                  src={heroImage.url}
                  alt='Hero'
                  className='h-40 w-auto rounded border object-cover'
                />
                <Button
                  variant='destructive'
                  size='icon'
                  className='absolute -right-2 -top-2 h-6 w-6'
                  onClick={() =>
                    deleteImageMutation.mutate({
                      eventId: event.id,
                      imageId: heroImage.id,
                    })
                  }
                  disabled={deleteImageMutation.isPending}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ) : (
              <div className='flex h-40 w-32 items-center justify-center rounded border-2 border-dashed'>
                <span className='text-sm text-muted-foreground'>
                  Sin imagen
                </span>
              </div>
            )}
            <div>
              <label htmlFor='hero-upload'>
                <Button
                  variant='outline'
                  asChild
                  disabled={uploadImageMutation.isPending}
                >
                  <span className='cursor-pointer'>
                    <Upload className='mr-2 h-4 w-4' />
                    {uploadImageMutation.isPending
                      ? 'Subiendo...'
                      : 'Subir Hero'}
                  </span>
                </Button>
              </label>
              <input
                id='hero-upload'
                type='file'
                accept='image/*'
                className='hidden'
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'hero');
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
