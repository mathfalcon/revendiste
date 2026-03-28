import {useQuery} from '@tanstack/react-query';
import {getExternalAccountsQuery} from '~/lib/api/profile';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';

function ProviderIcon({provider}: {provider: string}) {
  if (provider.includes('google')) {
    return (
      <svg className='h-5 w-5' viewBox='0 0 24 24'>
        <path
          d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z'
          fill='#4285F4'
        />
        <path
          d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
          fill='#34A853'
        />
        <path
          d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
          fill='#FBBC05'
        />
        <path
          d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
          fill='#EA4335'
        />
      </svg>
    );
  }

  return <span className='h-5 w-5 rounded-full bg-muted' />;
}

export function ConnectedAccounts() {
  const {data: accounts, isLoading} = useQuery(getExternalAccountsQuery());

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuentas conectadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse h-10 bg-muted rounded' />
        </CardContent>
      </Card>
    );
  }

  if (!accounts?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas conectadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {accounts.map(account => (
            <div
              key={account.id}
              className='flex items-center justify-between rounded-lg border p-3'
            >
              <div className='flex items-center gap-3'>
                <ProviderIcon provider={account.provider} />
                <div>
                  <p className='text-sm font-medium capitalize'>
                    {account.provider.replace('oauth_', '')}
                  </p>
                  {account.emailAddress && (
                    <p className='text-xs text-muted-foreground'>
                      {account.emailAddress}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant='outline'>Conectada</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
