import {LucideIcon} from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  count: number;
  variant?: 'pending' | 'waiting' | 'expired';
}

export function SectionHeader({
  icon: Icon,
  title,
  count,
  variant = 'pending',
}: SectionHeaderProps) {
  const variantStyles = {
    pending: {
      iconColor: 'text-orange-500',
      countBg: 'bg-orange-500/10',
      countColor: 'text-orange-500',
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
  };

  const styles = variantStyles[variant];

  return (
    <div className='flex items-center gap-2'>
      <Icon className={`h-5 w-5 ${styles.iconColor}`} />
      <h3 className='text-lg font-semibold text-foreground'>{title}</h3>
      <span
        className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${styles.countBg} ${styles.countColor}`}
      >
        {count}
      </span>
    </div>
  );
}
