import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Clock3, QrCode} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {getTicketCodeQuery} from '~/lib/api/tickets';

interface RotatingTicketCodeProps {
  ticketId: string;
  fallback: ReactNode;
}

export function RotatingTicketCode({ticketId, fallback}: RotatingTicketCodeProps) {
  const {data, isPending, refetch} = useQuery(getTicketCodeQuery(ticketId));
  const [secondsLeft, setSecondsLeft] = useState(0);

  const expiresAt = useMemo(() => {
    if (!data?.expiresAt) {
      return null;
    }
    return new Date(data.expiresAt).getTime();
  }, [data?.expiresAt]);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }

    const updateCountdown = () => {
      const next = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(next);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const refreshInMs = Math.max(1000, expiresAt - Date.now() - 30_000);
    const timeout = setTimeout(() => {
      void refetch();
    }, refreshInMs);

    return () => clearTimeout(timeout);
  }, [expiresAt, refetch]);

  if (isPending && !data) {
    return (
      <div className='rounded-lg border border-dashed bg-muted/20 p-6 text-center space-y-3 min-h-[200px] flex flex-col items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
        <p className='text-sm text-muted-foreground'>Generando código de acceso…</p>
      </div>
    );
  }

  if (!data) {
    return <>{fallback}</>;
  }

  return (
    <div className='rounded-lg border bg-card p-4 space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <QrCode className='h-4 w-4' />
          Código de acceso dinámico
        </div>
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums'>
          <Clock3 className='h-3.5 w-3.5' />
          {secondsLeft}s
        </div>
      </div>

      <div className='rounded-lg border bg-white p-4 flex items-center justify-center'>
        <QRCodeSVG value={data.qrPayload} size={220} includeMargin />
      </div>
    </div>
  );
}
