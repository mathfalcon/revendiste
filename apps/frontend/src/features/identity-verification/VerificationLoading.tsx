import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';

export function VerificationLoading() {
  return (
    <Card className='container mx-auto max-w-2xl px-4 py-8 my-12'>
      <CardContent className='flex h-96 items-center justify-center'>
        <LoadingSpinner size={96} />
      </CardContent>
    </Card>
  );
}
