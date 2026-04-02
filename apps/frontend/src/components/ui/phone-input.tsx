import {forwardRef, useState, useMemo} from 'react';
import * as RPNInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import {cn} from '~/lib/utils';
import {Input} from '~/components/ui/input';
import {Button} from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {ScrollArea} from '~/components/ui/scroll-area';
import {Check, ChevronsUpDown, Globe} from 'lucide-react';

type PhoneInputProps = Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'value' | 'ref'
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
    onChange?: (value: RPNInput.Value) => void;
  };

function PhoneInput({
  className,
  onChange,
  value,
  ...props
}: PhoneInputProps) {
  return (
    <RPNInput.default
      className={cn('flex', className)}
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      inputComponent={PhoneInputField}
      smartCaret={false}
      value={value || undefined}
      onChange={v => onChange?.(v || ('' as RPNInput.Value))}
      {...props}
    />
  );
}

const PhoneInputField = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({className, ...props}, ref) => (
  <Input
    ref={ref}
    className={cn('rounded-s-none border-s-0 focus-visible:z-10', className)}
    {...props}
  />
));
PhoneInputField.displayName = 'PhoneInputField';

type CountryEntry = {
  label: string;
  value: RPNInput.Country | undefined;
};

function CountrySelect({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
}) {
  const [open, setOpen] = useState(false);

  const countries = useMemo(
    () => countryList.filter((c): c is CountryEntry & {value: RPNInput.Country} => !!c.value),
    [countryList],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          disabled={disabled}
          className='flex gap-1 rounded-e-none border-e-0 px-2.5 focus:z-10'
        >
          <FlagComponent country={selectedCountry} countryName={selectedCountry} />
          <ChevronsUpDown className='h-3 w-3 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Buscar país...' className='h-9' />
          <CommandList>
            <CommandEmpty>País no encontrado.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className='h-[200px]'>
                {countries.map(({value, label}) => (
                  <CommandItem
                    key={value}
                    value={value}
                    keywords={[label]}
                    onSelect={() => {
                      onChange(value);
                      setOpen(false);
                    }}
                    className='flex items-center gap-2'
                  >
                    <FlagComponent country={value} countryName={label} />
                    <span className='flex-1 text-sm'>{label}</span>
                    <span className='text-muted-foreground text-xs'>
                      +{RPNInput.getCountryCallingCode(value)}
                    </span>
                    <Check
                      className={cn(
                        'ml-auto h-3 w-3',
                        value === selectedCountry ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FlagComponent({country, countryName}: RPNInput.FlagProps) {
  const Flag = flags[country];
  return (
    <span className='flex h-4 w-5 items-center justify-center overflow-hidden rounded-sm'>
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <Globe className='h-4 w-4 opacity-60' />
      )}
    </span>
  );
}

export {PhoneInput};
export type {PhoneInputProps};
