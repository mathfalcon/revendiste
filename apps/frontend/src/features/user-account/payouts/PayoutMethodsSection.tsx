import {useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {getPayoutMethodsQuery} from '~/lib/api/payouts';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {PayoutMethodForm} from './PayoutMethodForm';
import {DeletePayoutMethodDialog} from './DeletePayoutMethodDialog';
import {Skeleton} from '~/components/ui/skeleton';
import {Edit, Trash2, Plus, CreditCard} from 'lucide-react';
import {AccountEmptyState} from '../AccountEmptyState';
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
      <div className='space-y-3'>
        {[1, 2].map(i => (
          <div key={i} className='rounded-lg border p-4 space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-4 w-36' />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <p className='text-sm text-muted-foreground max-w-xl'>
          Los retiros se envían a uno de estos métodos. Podés tener varios y
          elegir el predeterminado al solicitar un retiro.
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className='cursor-pointer shrink-0 min-h-11 w-full sm:w-auto'>
              <Plus className='h-4 w-4 mr-2 shrink-0' aria-hidden />
              Agregar método
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar método de pago</DialogTitle>
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
        <AccountEmptyState
          icon={
            <CreditCard className='h-8 w-8 text-muted-foreground' aria-hidden />
          }
          title='No tenés métodos de pago'
          description='Agregá una cuenta bancaria uruguaya o PayPal para poder retirar tus ganancias.'
          action={
            <Button
              className='cursor-pointer min-h-11'
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className='h-4 w-4 mr-2 shrink-0' aria-hidden />
              Agregar método
            </Button>
          }
        />
      ) : (
        <div className='space-y-3'>
          {payoutMethods.map(method => (
            <Card key={method.id} className='transition-shadow duration-200'>
              <CardHeader>
                <div className='flex items-start justify-between gap-3'>
                  <CardTitle className='text-base flex flex-wrap items-center gap-2'>
                    {getPayoutMethodDisplayName(method)}
                    {method.isDefault && (
                      <Badge variant='secondary' className='text-xs'>
                        Por defecto
                      </Badge>
                    )}
                  </CardTitle>
                  <div className='flex gap-1 shrink-0'>
                    <Button
                      variant='outline'
                      size='icon'
                      className='cursor-pointer h-10 w-10 sm:h-9 sm:w-9'
                      aria-label='Editar método de pago'
                      onClick={() => setEditingMethod(method.id)}
                    >
                      <Edit className='h-4 w-4' aria-hidden />
                    </Button>
                    <Button
                      variant='outline'
                      size='icon'
                      className='cursor-pointer h-10 w-10 sm:h-9 sm:w-9'
                      aria-label='Eliminar método de pago'
                      onClick={() => setDeletingMethod(method.id)}
                    >
                      <Trash2 className='h-4 w-4' aria-hidden />
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
              <DialogTitle>Editar método de pago</DialogTitle>
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
