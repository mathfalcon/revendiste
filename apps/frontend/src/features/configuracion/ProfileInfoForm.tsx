import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {useUser} from '@clerk/tanstack-react-start';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {getCurrentUserQuery} from '~/lib';
import {updateProfileMutation, uploadProfileImageMutation, deleteProfileImageMutation} from '~/lib/api/profile';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '~/components/ui/form';
import {Input} from '~/components/ui/input';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Avatar, AvatarImage, AvatarFallback} from '~/components/ui/avatar';
import {Camera, Trash2, Loader2} from 'lucide-react';
import {useRef, useEffect} from 'react';

const MAX_IMAGE_SIZE = 512;
const IMAGE_QUALITY = 0.8;

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let {width, height} = img;
      if (width <= MAX_IMAGE_SIZE && height <= MAX_IMAGE_SIZE) {
        resolve(file);
        return;
      }

      const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, {type: 'image/jpeg'}));
        },
        'image/jpeg',
        IMAGE_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo procesar la imagen'));
    };

    img.src = url;
  });
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileInfoForm() {
  const {user} = useUser();
  const {data: currentUser} = useQuery(getCurrentUserQuery());
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user?.firstName, user?.lastName]);

  const updateProfile = useMutation({
    ...updateProfileMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users']});
      user?.reload();
    },
  });

  const uploadImage = useMutation({
    ...uploadProfileImageMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users']});
      user?.reload();
    },
  });

  const deleteImage = useMutation({
    ...deleteProfileImageMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users']});
      user?.reload();
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    await updateProfile.mutateAsync(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      uploadImage.mutate(compressed);
    } catch {
      uploadImage.mutate(file);
    }
  };

  const initials =
    (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información personal</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-20 w-20'>
            <AvatarImage src={currentUser?.imageUrl || user?.imageUrl} alt={user?.fullName || ''} />
            <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
          </Avatar>
          <div className='flex gap-2'>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/png,image/jpeg,image/webp'
              className='hidden'
              onChange={handleImageUpload}
            />
            <Button
              variant='outline'
              size='sm'
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImage.isPending}
            >
              {uploadImage.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Camera className='h-4 w-4' />
              )}
              Cambiar foto
            </Button>
            {(currentUser?.imageUrl || user?.hasImage) && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => deleteImage.mutate()}
                disabled={deleteImage.isPending}
              >
                {deleteImage.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Trash2 className='h-4 w-4' />
                )}
                Eliminar
              </Button>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='firstName'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder='Juan' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder='Pérez' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type='submit'
              disabled={updateProfile.isPending || !form.formState.isDirty}
            >
              {updateProfile.isPending && (
                <Loader2 className='h-4 w-4 animate-spin' />
              )}
              Guardar cambios
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
