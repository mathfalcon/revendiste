import {useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {getPayoutMethodsQuery} from '~/lib/api/payouts';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {PayoutMethodForm} from './PayoutMethodForm';
import {DeletePayoutMethodDialog} from './DeletePayoutMethodDialog';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Edit, Trash2, Plus} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {PayoutType} from '~/lib/api/generated';
import {
  getBankName,
  getEmail,
  getAccountNumber,
  getPayoutMethodDisplayName,
} from './payout-method-utils';

export function PayoutMethodsSection() {
  const queryClient = useQueryClient();
  const {data: payoutMethods, isPending} = useQuery(getPayoutMethodsQuery());
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  if (isPending) {
    return (
      <Card className='w-full'>
        <CardContent className='flex h-96 items-center justify-center'>
          <LoadingSpinner size={96} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold mb-2'>Métodos de Pago</h3>
          <p className='text-sm text-muted-foreground'>
            Gestiona tus métodos de pago para recibir tus ganancias
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              Agregar Método
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Método de Pago</DialogTitle>
            </DialogHeader>
            <PayoutMethodForm
              onSuccess={() => {
                setIsAddDialogOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ['payouts', 'payout-methods'],
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!payoutMethods || payoutMethods.length === 0 ? (
        <Card>
          <CardContent className='py-8 text-center text-muted-foreground'>
            No tienes métodos de pago configurados
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {payoutMethods.map(method => (
            <Card key={method.id}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    {getPayoutMethodDisplayName(method)}
                    {method.isDefault && (
                      <Badge variant='secondary' className='text-xs'>
                        Por defecto
                      </Badge>
                    )}
                  </CardTitle>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setEditingMethod(method.id)}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setDeletingMethod(method.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='text-sm'>
                  <span className='text-muted-foreground'>Tipo:</span>{' '}
                  <Badge variant='outline'>
                    {method.payoutType === PayoutType.Paypal
                      ? 'PayPal'
                      : 'Banco Uruguayo'}
                  </Badge>
                </div>
                <div className='text-sm'>
                  <span className='text-muted-foreground'>
                    {method.payoutType === PayoutType.Paypal
                      ? 'Email:'
                      : 'Cuenta:'}
                  </span>{' '}
                  {method.payoutType === PayoutType.Paypal
                    ? (() => {
                        const email = getEmail(method.metadata);
                        return email || 'N/A';
                      })()
                    : (() => {
                        const accountNumber = getAccountNumber(method.metadata);
                        return accountNumber || 'N/A';
                      })()}
                </div>
                <div className='text-sm'>
                  <span className='text-muted-foreground'>Titular:</span>{' '}
                  {method.accountHolderName} {method.accountHolderSurname}
                </div>
                <div className='text-sm'>
                  <span className='text-muted-foreground'>Moneda:</span>{' '}
                  <Badge variant='outline'>{method.currency}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingMethod && (
        <Dialog
          open={!!editingMethod}
          onOpenChange={open => !open && setEditingMethod(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Método de Pago</DialogTitle>
            </DialogHeader>
            <PayoutMethodForm
              methodId={editingMethod}
              onSuccess={() => {
                setEditingMethod(null);
                queryClient.invalidateQueries({
                  queryKey: ['payouts', 'payout-methods'],
                });
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {deletingMethod && payoutMethods && (
        <DeletePayoutMethodDialog
          open={deletingMethod !== null}
          onOpenChange={open => {
            if (!open) setDeletingMethod(null);
          }}
          method={payoutMethods.find(m => m.id === deletingMethod)!}
        />
      )}
    </div>
  );
}
