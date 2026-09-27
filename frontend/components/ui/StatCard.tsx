'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  isAlert?: boolean;
  icon: LucideIcon;
  index?: number;
  accent?: 'primary' | 'emerald' | 'amber' | 'rose';
}

const accentStyles = {
  primary: { icon: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/20' },
  emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  amber: { icon: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  rose: { icon: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-200' },
};

export function StatCard({
  title,
  value,
  trend,
  trendUp,
  isAlert,
  icon: Icon,
  index = 0,
  accent = 'primary',
}: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="card-elevated p-6 relative overflow-hidden group"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex justify-between items-start mb-4 relative">
        <div className={cn('p-2.5 rounded-xl ring-1', styles.bg, styles.ring)}>
          <Icon className={cn('h-5 w-5', isAlert ? 'text-amber-600' : styles.icon)} />
        </div>
        {!isAlert && (
          <span
            className={cn(
              'badge text-[10px]',
              trendUp ? 'badge-success' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
            )}
          >
            {trend}
          </span>
        )}
      </div>

      <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">{value}</div>
      <div
        className={cn(
          'text-xs font-medium',
          isAlert ? 'text-amber-600' : trendUp ? 'text-emerald-600' : 'text-rose-500'
        )}
      >
        {trend} {!isAlert && 'vs last year'}
      </div>
    </motion.div>
  );
}
