import {useEffect, useState} from 'react';
import {useNavigate, useSearch} from '@tanstack/react-router';
import {keepPreviousData, useMutation, useQuery} from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Input} from '~/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Label} from '~/components/ui/label';
import {Textarea} from '~/components/ui/textarea';
import {Avatar, AvatarFallback, AvatarImage} from '~/components/ui/avatar';
import {
  adminUsersListQueryOptions,
  createSignInTokenMutationOptions,
} from '~/lib/api/admin';
import {Skeleton} from '~/components/ui/skeleton';
import {toast} from 'sonner';
import {ChevronLeft, ChevronRight} from 'lucide-react';

function displayName(first: string | null, last: string | null, email: string) {
  const n = [first, last].filter(Boolean).join(' ').trim();
  return n || email;
}

function roleLabel(role: 'admin' | 'organizer' | 'user') {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'organizer':
      return 'Organizador';
    default:
      return 'Usuario';
  }
}

export function AdminUsersPage() {
  const search = useSearch({from: '/admin/usuarios'});
  const navigate = useNavigate({from: '/admin/usuarios'});

  const [buscarDraft, setBuscarDraft] = useState(search.buscar ?? '');
  const [impersonateUserId, setImpersonateUserId] = useState<string | null>(
    null,
  );
  const [reasonDraft, setReasonDraft] = useState('');

  useEffect(() => {
    setBuscarDraft(search.buscar ?? '');
  }, [search.buscar]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = buscarDraft.trim();
      const current = (search.buscar ?? '').trim();
      if (next === current) {
        return;
      }
      navigate({
        search: prev => ({
          ...prev,
          page: 1,
          buscar: next === '' ? undefined : next,
        }),
      });
    }, 350);
    return () => clearTimeout(t);
  }, [buscarDraft, navigate, search.buscar]);

  const listParams = {
    page: search.page ?? 1,
    limit: search.limit ?? 20,
    sortBy: search.sortBy ?? 'createdAt',
    sortOrder: search.sortOrder ?? 'desc',
    buscar: search.buscar,
  };

  const {data, isFetching, isError} = useQuery({
    ...adminUsersListQueryOptions(listParams),
    placeholderData: keepPreviousData,
  });

  const impersonationMutation = useMutation({
    ...createSignInTokenMutationOptions(),
    onSuccess: res => {
      setImpersonateUserId(null);
      setReasonDraft('');
      // Clerk Frontend API URL: signs out current session, redirects to
      // /ingresar with __clerk_ticket to complete impersonation sign-in.
      window.location.href = res.impersonationUrl;
    },
    onError: (err: Error & {response?: {data?: {message?: string}}}) => {
      const msg =
        err.response?.data?.message ??
        'No se pudo generar el token. Intentá de nuevo.';
      toast.error(msg);
    },
  });

  const pagination = data?.pagination;
  const rows = data?.data ?? [];

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Usuarios</h1>
        <p className='text-muted-foreground text-sm'>
          Buscá usuarios e iniciá una sesión temporal como ellos para soporte.
        </p>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Buscar</CardTitle>
          <CardDescription>
            Por email, nombre o apellido (coincidencia parcial).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder='Buscar…'
            value={buscarDraft}
            onChange={e => setBuscarDraft(e.target.value)}
            aria-label='Buscar usuarios'
          />
        </CardContent>
      </Card>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[52px]' />
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead className='text-right'>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && !data ? (
              Array.from({length: 8}).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className='h-9 w-9 rounded-full' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-40' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-48' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-20' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-28' />
                  </TableCell>
                  <TableCell className='text-right'>
                    <Skeleton className='ml-auto h-9 w-28' />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center'>
                  No se pudieron cargar los usuarios
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center'>
                  No hay usuarios para mostrar
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({user}) => {
                const name = displayName(
                  user.firstName,
                  user.lastName,
                  user.email,
                );
                const initials = name
                  .split(/\s+/)
                  .map(p => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar className='h-9 w-9'>
                        <AvatarImage src={user.imageUrl ?? undefined} alt='' />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className='font-medium'>{name}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{roleLabel(user.role)}</Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {user.lastActiveAt
                        ? new Date(user.lastActiveAt).toLocaleString('es-UY')
                        : '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={
                          user.role === 'admin' ||
                          impersonationMutation.isPending
                        }
                        onClick={() => setImpersonateUserId(user.id)}
                      >
                        Impersonar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className='flex items-center justify-between gap-4'>
          <p className='text-muted-foreground text-sm'>
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!pagination.hasPrev || isFetching}
              onClick={() =>
                navigate({
                  search: prev => ({
                    ...prev,
                    page: Math.max(1, (prev.page ?? 1) - 1),
                  }),
                })
              }
            >
              <ChevronLeft className='h-4 w-4' />
              Anterior
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!pagination.hasNext || isFetching}
              onClick={() =>
                navigate({
                  search: prev => ({
                    ...prev,
                    page: (prev.page ?? 1) + 1,
                  }),
                })
              }
            >
              Siguiente
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={impersonateUserId !== null}
        onOpenChange={open => {
          if (!open) {
            setImpersonateUserId(null);
            setReasonDraft('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonar usuario</DialogTitle>
            <DialogDescription>
              Se iniciará sesión como este usuario en esta pestaña. Para volver
              a tu cuenta de administrador, cerrá sesión desde el menú de
              usuario.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='impersonation-reason'>
              Motivo (opcional, para registro interno)
            </Label>
            <Textarea
              id='impersonation-reason'
              value={reasonDraft}
              onChange={e => setReasonDraft(e.target.value)}
              placeholder='Ej.: reproducción de error en checkout'
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              onClick={() => {
                setImpersonateUserId(null);
                setReasonDraft('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              disabled={impersonationMutation.isPending || !impersonateUserId}
              onClick={() => {
                if (!impersonateUserId) {
                  return;
                }
                impersonationMutation.mutate({
                  targetUserId: impersonateUserId,
                  reason: reasonDraft.trim() || undefined,
                });
              }}
            >
              {impersonationMutation.isPending ? 'Impersonando…' : 'Impersonar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
