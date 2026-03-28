import {useState} from 'react';
import {useUser} from '@clerk/tanstack-react-start';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  getEmailsQuery,
  addEmailMutation,
  verifyEmailMutation,
  setPrimaryEmailMutation,
  deleteEmailMutation,
} from '~/lib/api/profile';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Input} from '~/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {Mail, Plus, Star, Trash2, Loader2} from 'lucide-react';
import {toast} from 'sonner';

export function EmailManagement() {
  const {user} = useUser();
  const queryClient = useQueryClient();
  const {data: emails, isLoading} = useQuery(getEmailsQuery());

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null);

  const addEmail = useMutation({
    ...addEmailMutation(),
    onSuccess: data => {
      setPendingEmailId(data.emailAddressId);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Error al agregar el email';
      toast.error(message);
    },
  });

  const verifyEmail = useMutation({
    ...verifyEmailMutation(),
    onSuccess: () => {
      toast.success('Email verificado');
      queryClient.invalidateQueries({queryKey: ['profile', 'emails']});
      user?.reload();
      resetDialog();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Código de verificación incorrecto';
      toast.error(message);
    },
  });

  const setPrimary = useMutation({
    ...setPrimaryEmailMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['profile', 'emails']});
      user?.reload();
    },
  });

  const deleteEmail = useMutation({
    ...deleteEmailMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['profile', 'emails']});
      user?.reload();
    },
  });

  const handleAddEmail = () => {
    if (!newEmail.trim()) return;
    addEmail.mutate(newEmail);
  };

  const handleVerifyEmail = () => {
    if (!pendingEmailId || !verificationCode.trim()) return;
    verifyEmail.mutate({emailAddressId: pendingEmailId, code: verificationCode});
  };

  const resetDialog = () => {
    setAddDialogOpen(false);
    setNewEmail('');
    setVerificationCode('');
    setPendingEmailId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Direcciones de email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-3'>
            <div className='h-10 bg-muted rounded' />
            <div className='h-10 bg-muted rounded' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Direcciones de email</CardTitle>
        <Dialog
          open={addDialogOpen}
          onOpenChange={open => {
            if (!open) resetDialog();
            else setAddDialogOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button variant='outline' size='sm'>
              <Plus className='h-4 w-4' />
              Agregar email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {pendingEmailId
                  ? 'Verificar email'
                  : 'Agregar dirección de email'}
              </DialogTitle>
              <DialogDescription>
                {pendingEmailId
                  ? `Ingresá el código de verificación enviado a ${newEmail}`
                  : 'Ingresá la nueva dirección de email. Te enviaremos un código de verificación.'}
              </DialogDescription>
            </DialogHeader>
            {pendingEmailId ? (
              <div className='space-y-4'>
                <Input
                  placeholder='Código de verificación'
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyEmail()}
                />
                <div className='flex gap-2 justify-end'>
                  <Button variant='outline' onClick={resetDialog}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleVerifyEmail}
                    disabled={
                      verifyEmail.isPending || !verificationCode.trim()
                    }
                  >
                    {verifyEmail.isPending && (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    )}
                    Verificar
                  </Button>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <Input
                  type='email'
                  placeholder='nuevo@email.com'
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddEmail()}
                />
                <div className='flex gap-2 justify-end'>
                  <Button variant='outline' onClick={resetDialog}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddEmail}
                    disabled={addEmail.isPending || !newEmail.trim()}
                  >
                    {addEmail.isPending && (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    )}
                    Enviar código
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {emails?.map(email => (
            <div
              key={email.id}
              className='flex items-center justify-between rounded-lg border p-3'
            >
              <div className='flex items-center gap-3'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>{email.emailAddress}</span>
                {email.isPrimary && (
                  <Badge variant='secondary' className='text-xs'>
                    Principal
                  </Badge>
                )}
              </div>
              {!email.isPrimary && (
                <div className='flex gap-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setPrimary.mutate(email.id)}
                    disabled={setPrimary.isPending}
                    title='Hacer principal'
                  >
                    <Star className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => deleteEmail.mutate(email.id)}
                    disabled={deleteEmail.isPending}
                    title='Eliminar'
                  >
                    <Trash2 className='h-4 w-4 text-destructive' />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
