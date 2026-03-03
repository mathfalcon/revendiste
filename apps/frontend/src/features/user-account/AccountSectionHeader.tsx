import type {LucideIcon} from 'lucide-react';

export type AccountSectionHeaderVariant =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'waiting'
  | 'expired'
  | 'active'
  | 'sold';

interface AccountSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  count: number;
  variant: AccountSectionHeaderVariant;
}

const variantStyles: Record<
  AccountSectionHeaderVariant,
  {iconColor: string; countBg: string; countColor: string}
> = {
  pending: {
    iconColor: 'text-amber-500',
    countBg: 'bg-amber-500/10',
    countColor: 'text-amber-600 dark:text-amber-400',
  },
  confirmed: {
    iconColor: 'text-green-500',
    countBg: 'bg-green-500/10',
    countColor: 'text-green-600 dark:text-green-400',
  },
  cancelled: {
    iconColor: 'text-muted-foreground',
    countBg: 'bg-muted',
    countColor: 'text-muted-foreground',
  },
  waiting: {
    iconColor: 'text-muted-foreground',
    countBg: 'bg-muted',
    countColor: 'text-muted-foreground',
  },
  expired: {
    iconColor: 'text-destructive',
    countBg: 'bg-destructive/10',
    countColor: 'text-destructive',
  },
  active: {
    iconColor: 'text-blue-500',
    countBg: 'bg-blue-500/10',
    countColor: 'text-blue-600 dark:text-blue-400',
  },
  sold: {
    iconColor: 'text-green-500',
    countBg: 'bg-green-500/10',
    countColor: 'text-green-600 dark:text-green-400',
  },
};

export function AccountSectionHeader({
  icon: Icon,
  title,
  count,
  variant,
}: AccountSectionHeaderProps) {
  const styles = variantStyles[variant];

  return (
    <div className='flex items-center gap-2'>
      <Icon className={`h-5 w-5 ${styles.iconColor}`} />
      <h3 className='text-lg font-semibold'>{title}</h3>
      <span
        className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${styles.countBg} ${styles.countColor}`}
      >
        {count}
      </span>
    </div>
  );
}
