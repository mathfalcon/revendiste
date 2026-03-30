import {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {useClerk} from '@clerk/tanstack-react-start';
import {useRouter} from '@tanstack/react-router';
import {deleteAccountMutation} from '~/lib/api/profile';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import {Loader2, Trash2} from 'lucide-react';

export function DeleteAccountSection() {
  const {signOut} = useClerk();
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [open, setOpen] = useState(false);

  const deleteAccount = useMutation({
    ...deleteAccountMutation(),
    onSuccess: async () => {
      await signOut();
      router.navigate({to: '/'});
    },
  });

  const isConfirmed = confirmation === 'ELIMINAR';

  return (
    <Card className='border-destructive'>
      <CardHeader>
        <CardTitle className='text-destructive'>Eliminar cuenta</CardTitle>
        <CardDescription>
          Esta acción es irreversible. Se eliminarán todos tus datos,
          publicaciones y transacciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={open => {
          setOpen(open);
          if (!open) setConfirmation('');
        }}>
          <AlertDialogTrigger asChild>
            <Button variant='destructive'>
              <Trash2 className='h-4 w-4' />
              Eliminar mi cuenta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Estás seguro que querés eliminar tu cuenta?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminarán permanentemente
                tu cuenta y todos los datos asociados. Escribí{' '}
                <span className='font-mono font-bold'>ELIMINAR</span> para
                confirmar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              placeholder='Escribí ELIMINAR para confirmar'
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={!isConfirmed || deleteAccount.isPending}
                onClick={e => {
                  e.preventDefault();
                  deleteAccount.mutate();
                }}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {deleteAccount.isPending && (
                  <Loader2 className='h-4 w-4 animate-spin' />
                )}
                Eliminar cuenta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
