import {SearchIcon} from 'lucide-react';
import {Input} from '../ui/input';
import {cx} from 'class-variance-authority';

export const SearchInput = (props: React.ComponentProps<'input'>) => {
  return (
    <form className='relative w-full'>
      <Input
        id='event-search'
        name='event-search'
        placeholder='Buscar'
        type='search'
        {...props}
        className={cx('peer h-8 ps-8 pe-2', props.className)}
      />
      <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 peer-disabled:opacity-50'>
        <SearchIcon size={16} />
      </div>
    </form>
  );
};
