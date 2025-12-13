import {Check, ChevronsUpDown} from 'lucide-react';
import {useState} from 'react';
import {cn} from '~/lib/utils';
import {Button} from '~/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps<T extends ComboboxOption = ComboboxOption> {
  value?: string;
  onValueChange?: (value: string) => void;
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  description?: string;
  options: T[];
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  renderOption?: (option: T, isSelected: boolean) => React.ReactNode;
  onSearchValueChange?: (searchValue: string) => void;
  isLoading?: boolean;
}

export function Combobox<T extends ComboboxOption = ComboboxOption>({
  value,
  onValueChange,
  label,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No option found.',
  description,
  options,
  className,
  buttonClassName,
  disabled = false,
  renderOption,
  onSearchValueChange,
  isLoading = false,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <FormItem className={cn('flex flex-col', className)}>
      <FormLabel>{label}</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant='outline'
              role='combobox'
              disabled={disabled}
              className={cn(
                'w-full justify-between',
                !value && 'text-muted-foreground',
                buttonClassName,
              )}
            >
              <span className='truncate text-left flex-1'>
                {value
                  ? options.find(option => option.value === value)?.label
                  : placeholder}
              </span>
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              className='h-9'
              onValueChange={onSearchValueChange}
            />
            <CommandList>
              {isLoading ? (
                <div className='py-6 text-center text-sm text-muted-foreground'>
                  <div className='flex items-center justify-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    Buscando...
                  </div>
                </div>
              ) : options.length === 0 ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {options.map(option => {
                    const isSelected = option.value === value;
                    return (
                      <CommandItem
                        value={option.label}
                        key={option.value}
                        onSelect={() => {
                          onValueChange?.(option.value);
                          setOpen(false);
                        }}
                      >
                        {renderOption ? (
                          renderOption(option, isSelected)
                        ) : (
                          <>
                            {option.label}
                            <Check
                              className={cn(
                                'ml-auto h-4 w-4',
                                isSelected ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                          </>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}
