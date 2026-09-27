'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { name: 'Upload', href: '/upload' },
  { name: 'Review', href: '/review' },
  { name: 'Compare', href: '/compare' },
  { name: 'Export', href: '/export' },
];

export function FilingProgress({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const currentIndex = steps.findIndex((s) => pathname.startsWith(s.href));
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  if (compact) {
    return (
      <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-gradient-to-br from-primary/8 to-secondary/5 border border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">Filing Progress</span>
          <span className="text-xs font-bold text-primary">{Math.round(((activeIndex + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">Step {activeIndex + 1} of {steps.length}: {steps[activeIndex]?.name}</p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Your Filing Journey</h3>
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => {
          const isComplete = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.name} className="flex items-center flex-1 last:flex-none">
              <Link href={step.href} className="flex flex-col items-center gap-1.5 group min-w-0">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                    isComplete && 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
                    isCurrent && 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/20',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  )}
                >
                  {isComplete ? <CheckCircle2 size={16} /> : <Circle size={14} />}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium truncate',
                    isCurrent ? 'text-primary' : isComplete ? 'text-emerald-600' : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </span>
              </Link>
              {idx < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-1 rounded-full mb-4', idx < activeIndex ? 'bg-emerald-400' : 'bg-border')} />
              )}
            </div>
          );
        })}
      </div>
      <Link
        href={steps[activeIndex]?.href || '/upload'}
        className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        Continue filing <ChevronRight size={14} />
      </Link>
    </div>
  );
}
