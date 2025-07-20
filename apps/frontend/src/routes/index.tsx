import {useQuery} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {api} from '~/lib';
export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const {data} = useQuery({
    queryKey: ['health'],
    queryFn: () => api.examples.getAll(),
  });
  console.log(data);
  return (
    <div className='p-2'>
      <h3>Welcome Home!!!</h3>
    </div>
  );
}
