import {useState} from 'react';
import {Copy, Check} from 'lucide-react';
import {Button, type ButtonProps} from './button';
import {copyToClipboard} from '~/utils';
import {toast} from 'sonner';
import {cn} from '~/lib/utils';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * The text to copy to clipboard
   */
  text: string;
  /**
   * Custom success message (default: "Copiado al portapapeles")
   */
  successMessage?: string;
  /**
   * Custom error message (default: "Error al copiar al portapapeles")
   */
  errorMessage?: string;
  /**
   * Duration in milliseconds to show the check icon (default: 2000)
   */
  copiedDuration?: number;
  /**
   * Callback fired when copy succeeds
   */
  onCopySuccess?: () => void;
  /**
   * Callback fired when copy fails
   */
  onCopyError?: () => void;
}

/**
 * A button component that copies text to clipboard with visual feedback
 *
 * Features:
 * - Shows Copy icon normally, Check icon when copied
 * - Handles clipboard operations with fallback support
 * - Shows toast notifications
 * - Fully customizable via Button props
 */
export function CopyButton({
  text,
  successMessage = 'Copiado al portapapeles',
  errorMessage = 'Error al copiar al portapapeles',
  copiedDuration = 2000,
  onCopySuccess,
  onCopyError,
  className,
  children,
  ...buttonProps
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      toast.success(successMessage);
      onCopySuccess?.();
      setTimeout(() => setCopied(false), copiedDuration);
    } else {
      toast.error(errorMessage);
      onCopyError?.();
    }
  };

  return (
    <Button
      type='button'
      onClick={handleCopy}
      className={cn(className)}
      {...buttonProps}
    >
      {copied ? (
        <Check className='h-4 w-4 text-green-600' />
      ) : (
        <Copy className='h-4 w-4' />
      )}
      {children}
    </Button>
  );
}

