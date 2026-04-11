import type {ReactNode} from 'react';
import type {LucideIcon} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Skeleton} from '~/components/ui/skeleton';
import {cn} from '~/lib/utils';

type StatCardProps = {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  isLoading?: boolean;
  accentClassName?: string;
  description?: string;
};

export function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
  accentClassName = 'border-l-primary',
  description,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'border-l-4 transition-colors duration-200',
        accentClassName,
      )}
    >
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <Icon className='h-4 w-4 shrink-0 text-muted-foreground' aria-hidden />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-8 w-24' />
        ) : (
          <>
            <div className='text-2xl font-bold tabular-nums'>{value}</div>
            {description ? (
              <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
