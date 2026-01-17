import {useState} from 'react';
import {Copy, Check} from 'lucide-react';
import {copyToClipboard} from '~/utils';
import {toast} from 'sonner';
import {cn} from '~/lib/utils';

export interface CopyableTextProps {
  /**
   * The text to display and copy
   */
  text: string;
  /**
   * Optional label to show before the text
   */
  label?: string;
  /**
   * Custom success message (default: "Copiado al portapapeles")
   */
  successMessage?: string;
  /**
   * Whether to truncate the text on mobile (shows first 8 and last 4 characters)
   */
  truncateOnMobile?: boolean;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Additional className for the text
   */
  textClassName?: string;
}

/**
 * A component that displays text with a copy button next to it
 *
 * Features:
 * - Shows text with a small copy button
 * - Optional truncation for UUIDs on mobile
 * - Visual feedback when copied
 */
export function CopyableText({
  text,
  label,
  successMessage = 'Copiado al portapapeles',
  truncateOnMobile = false,
  className,
  textClassName,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Error al copiar al portapapeles');
    }
  };

  // Truncate UUID for mobile: show first 8 chars + ... + last 4 chars
  const truncatedText =
    text.length > 16 ? `${text.slice(0, 8)}...${text.slice(-4)}` : text;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && (
        <span className='text-muted-foreground text-sm'>{label}</span>
      )}
      <span
        className={cn(
          'font-mono text-sm',
          truncateOnMobile && 'sm:hidden',
          textClassName,
        )}
      >
        {truncateOnMobile ? truncatedText : text}
      </span>
      {truncateOnMobile && (
        <span className={cn('font-mono text-sm hidden sm:inline', textClassName)}>
          {text}
        </span>
      )}
      <button
        type='button'
        onClick={handleCopy}
        className='inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors'
        title='Copiar'
      >
        {copied ? (
          <Check className='h-3.5 w-3.5 text-green-500' />
        ) : (
          <Copy className='h-3.5 w-3.5 text-muted-foreground' />
        )}
      </button>
    </div>
  );
}
