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
import {Badge} from '~/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {deleteTicketWaveMutation} from '~/lib/api/admin';
import {TicketWaveEditDialog} from './TicketWaveEditDialog';
import {toast} from 'sonner';
import {Edit, Trash2, Plus, Loader2} from 'lucide-react';
import type {AdminEventDetail} from '~/lib/api/admin/admin-event-types';

interface EventTicketWavesSectionProps {
  event: AdminEventDetail;
}

export function EventTicketWavesSection({event}: EventTicketWavesSectionProps) {
  const queryClient = useQueryClient();
  const [editingWaveId, setEditingWaveId] = useState<string | null>(null);
  const [creatingWave, setCreatingWave] = useState(false);
  const [deletingWaveId, setDeletingWaveId] = useState<string | null>(null);

  const deleteWaveMutation = useMutation({
    ...deleteTicketWaveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'events', event.id]});
      toast.success('Tanda de tickets eliminada');
      setDeletingWaveId(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Error al eliminar la tanda de tickets',
      );
    },
  });

  const handleDeleteWave = (waveId: string) => {
    setDeletingWaveId(waveId);
  };

  const confirmDeleteWave = () => {
    if (deletingWaveId) {
      deleteWaveMutation.mutate({eventId: event.id, waveId: deletingWaveId});
    }
  };

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-lg'>Tandas de Entradas</CardTitle>
            <CardDescription>Gestiona las olas de venta</CardDescription>
          </div>
          <Button size='sm' onClick={() => setCreatingWave(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Nueva Tanda
          </Button>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Valor Nominal</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!event.ticketWaves || event.ticketWaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center'>
                      No hay tandas de tickets
                    </TableCell>
                  </TableRow>
                ) : (
                  event.ticketWaves.map(wave => (
                    <TableRow key={wave.id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{wave.name}</div>
                          {wave.description && (
                            <div className='text-xs text-muted-foreground'>
                              {wave.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{wave.faceValue}</TableCell>
                      <TableCell>{wave.currency}</TableCell>
                      <TableCell>
                        <div className='flex gap-1'>
                          {wave.isSoldOut && (
                            <Badge variant='destructive'>Agotado</Badge>
                          )}
                          {!wave.isAvailable && (
                            <Badge variant='secondary'>No disponible</Badge>
                          )}
                          {!wave.isSoldOut && wave.isAvailable && (
                            <Badge variant='outline'>Disponible</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setEditingWaveId(wave.id)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive'
                            onClick={() => handleDeleteWave(wave.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Ticket Wave Confirmation */}
      <AlertDialog
        open={!!deletingWaveId}
        onOpenChange={(open: boolean) => !open && setDeletingWaveId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tanda de tickets?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWave}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteWaveMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ticket Wave Edit/Create Dialog */}
      {(editingWaveId || creatingWave) && (
        <TicketWaveEditDialog
          eventId={event.id}
          waveId={editingWaveId}
          open={!!editingWaveId || creatingWave}
          onOpenChange={open => {
            if (!open) {
              setEditingWaveId(null);
              setCreatingWave(false);
            }
          }}
        />
      )}
    </>
  );
}
