import * as React from 'react';
import {Input} from './input';
import {cn} from '~/lib/utils';
import {EventTicketCurrency} from '~/lib';
import {getCurrencySymbol} from '~/utils';

interface PriceInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
  locale?: string;
  currency?: EventTicketCurrency;
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  (
    {value = 0, onChange, locale = 'es-ES', currency, className, ...props},
    ref,
  ) => {
    const [displayValue, setDisplayValue] = React.useState(
      value ? value.toLocaleString(locale) : '',
    );

    React.useEffect(() => {
      setDisplayValue(value ? value.toLocaleString(locale) : '');
    }, [value, locale]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // strip everything that's not a digit
      const raw = e.target.value.replace(/\D/g, '');
      const num = raw === '' ? 0 : Number(raw);

      // update parent component
      onChange?.(num);

      // update display with separators
      setDisplayValue(raw === '' ? '' : num.toLocaleString(locale));
    };

    const handleBlur = () => {
      if (value) {
        setDisplayValue(value.toLocaleString(locale));
      }
    };

    const symbol = getCurrencySymbol(currency ?? EventTicketCurrency.UYU);

    return (
      <div className='relative'>
        <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none'>
          {symbol}
        </div>
        <Input
          ref={ref}
          type='text'
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(symbol.length === 3 ? 'pl-14' : 'pl-8', className)}
          {...props}
        />
      </div>
    );
  },
);

PriceInput.displayName = 'PriceInput';

export {PriceInput};
