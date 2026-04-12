import {Loader2, Scale} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {cn} from '~/lib/utils';
import type {PreviewSettlementResponse} from '~/lib/api/generated';
import {SettlementPreviewPanel} from './SettlementPreviewPanel';

export interface SettlementReconciliationCardProps {
  previewResult: PreviewSettlementResponse | null;
  previewLoading: boolean;
}

export function SettlementReconciliationCard({
  previewResult,
  previewLoading,
}: SettlementReconciliationCardProps) {
  return (
    <Card
      className={cn(
        'shadow-sm lg:sticky lg:top-0',
        previewLoading && 'opacity-90',
      )}
    >
      <CardHeader className='space-y-1 pb-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Scale className='h-5 w-5 text-muted-foreground' />
            <CardTitle className='text-base'>Conciliación</CardTitle>
          </div>
          {previewLoading && (
            <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
              Verificando
            </span>
          )}
        </div>
        <CardDescription>
          Resultado del paso previo obligatorio al guardar (FIFO hasta cubrir el
          monto).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettlementPreviewPanel
          result={previewResult}
          isLoading={previewLoading}
        />
      </CardContent>
    </Card>
  );
}
