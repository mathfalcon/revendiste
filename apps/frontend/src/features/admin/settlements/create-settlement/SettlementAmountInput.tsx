import {useEffect, useRef, useState} from 'react';
import {Input} from '~/components/ui/input';
import {formatAmount, getCurrencySymbol} from '~/utils';
import {parseAmountInputToApiString} from './parse-amount-input';

export interface SettlementAmountInputProps {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onRawChange: (raw: string) => void;
  currency: 'UYU' | 'USD';
  disabled?: boolean;
  sheetOpen: boolean;
}

export function SettlementAmountInput({
  value,
  onChange,
  onBlur,
  onRawChange,
  currency,
  disabled,
  sheetOpen,
}: SettlementAmountInputProps) {
  const [draft, setDraft] = useState('');
  const prevOpenRef = useRef(false);
  const symbol = getCurrencySymbol(currency);

  useEffect(() => {
    if (!sheetOpen) {
      prevOpenRef.current = false;
      return;
    }
    if (!prevOpenRef.current) {
      setDraft(value ? formatAmount(value) : '');
    }
    prevOpenRef.current = true;
  }, [sheetOpen, value]);

  return (
    <div className='relative'>
      <span
        className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground tabular-nums'
        aria-hidden
      >
        {symbol}
      </span>
      <Input
        className='pl-10 font-variant-numeric tabular-nums'
        inputMode='decimal'
        autoComplete='off'
        disabled={disabled}
        value={draft}
        onChange={e => {
          const next = e.target.value;
          setDraft(next);
          onRawChange(next);
          onChange(parseAmountInputToApiString(next) ?? '');
        }}
        onBlur={() => {
          const api = parseAmountInputToApiString(draft);
          if (api && Number(api) > 0) {
            onChange(api);
            onRawChange(formatAmount(api));
            setDraft(formatAmount(api));
          } else {
            onChange('');
            onRawChange('');
            setDraft('');
          }
          onBlur();
        }}
      />
    </div>
  );
}
