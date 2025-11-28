import {LucideIcon} from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  count: number;
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  count,
  className,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Icon className='h-5 w-5' />
      <h3 className='text-lg font-semibold'>
        {title} ({count})
      </h3>
    </div>
  );
}

