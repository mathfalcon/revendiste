import {Card, CardContent} from '~/components/ui/card';

interface AccountEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function AccountEmptyState({
  icon,
  title,
  description,
  action,
}: AccountEmptyStateProps) {
  return (
    <Card className='w-full'>
      <CardContent className='flex flex-col items-center justify-center py-16 px-6 text-center'>
        {icon && (
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4'>
            {icon}
          </div>
        )}
        <h3 className='text-lg font-semibold mb-2'>{title}</h3>
        <p className='text-muted-foreground mb-6 max-w-sm'>{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
