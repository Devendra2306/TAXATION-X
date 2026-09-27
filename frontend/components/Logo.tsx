import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

const sizes = {
  sm: { icon: 'w-5 h-5', text: 'text-base' },
  md: { icon: 'w-7 h-7', text: 'text-xl' },
  lg: { icon: 'w-9 h-9', text: 'text-2xl' },
};

export function Logo({ className, size = 'md', href = '/' }: LogoProps) {
  const s = sizes[size];

  const content = (
    <div className={cn('flex items-center gap-2.5 group', className)}>
      <div
        className={cn(
          s.icon,
          'rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow'
        )}
      >
        <svg viewBox="0 0 24 24" className="w-[55%] h-[55%] text-white" fill="currentColor">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
        </svg>
      </div>
      <span className={cn(s.text, 'font-bold tracking-tight text-foreground')}>
        Nex<span className="text-gradient">Tax</span>
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
